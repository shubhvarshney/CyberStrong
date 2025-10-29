import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserDataService } from '../services/UserDataService';
import { LocalDataService } from '../services/LocalDataService';
import QuizReview from '../components/QuizReview';

// Shows all the quizzes, sorting them by whether they were completed, allowing the user to review them

const QuizzesScreen = () => {
  const { currentUser, refreshUserProfile } = useAuth();
  const { theme } = useTheme();
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
  const [awardedBadges, setAwardedBadges] = useState([]);
  const [reviewQuiz, setReviewQuiz] = useState(null); 
  const [reviewAnswers, setReviewAnswers] = useState([]); 

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    (async () => {
      if (!currentUser?.uid) return;
      try {
        const history = await UserDataService.getQuizHistory(currentUser.uid, 100);
        const ids = new Set(history.map(h => h.quizId));
        setCompletedQuizIds(ids);
      } catch (e) {
        console.warn('Failed to load quiz history:', e?.message);
      }
    })();
  }, [currentUser?.uid, showResult]);

  const loadQuizzes = () => {
    const localQuizzes = LocalDataService.getQuizzes();
    setQuizzes(localQuizzes);
  };

  const handleReviewQuiz = async (quiz) => {
    if (!currentUser?.uid) return;
    try {
      const history = await UserDataService.getQuizHistory(currentUser.uid, 100);
      const quizResult = history.find(h => h.quizId === quiz.id);
      if (quizResult && Array.isArray(quizResult.answers)) {
        setReviewQuiz(quiz);
        setReviewAnswers(quizResult.answers);
      } else {
        alert('No answer data found for this quiz.');
      }
    } catch (e) {
      alert('Failed to load quiz review.');
    }
  };

  const [answers, setAnswers] = useState([]); 

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnswers([]);
  };

  const selectAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const nextQuestion = async () => {
    if (selectedAnswer === null) {
      Alert.alert('Please select an answer');
      return;
    }
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    let newScore = score;
    if (selectedAnswer === currentQuestion.correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
    }
    setAnswers(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = selectedAnswer;
      return updated;
    });
    if (currentQuestionIndex + 1 < currentQuiz.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      if (currentUser?.uid) {
        try {
          const quizResult = {
            quizName: currentQuiz.title,
            quizId: currentQuiz.id,
            score: newScore,
            totalQuestions: currentQuiz.questions.length,
            percentage: Math.round((newScore / currentQuiz.questions.length) * 100),
            difficulty: currentQuiz.difficulty,
            completedAt: new Date(),
            answers: [...answers, selectedAnswer],
          };
          const saveRes = await UserDataService.saveQuizResult(currentUser.uid, quizResult);
          if (saveRes?.awardedBadges?.length) setAwardedBadges(saveRes.awardedBadges);
          await refreshUserProfile(); 
          try {
            const history = await UserDataService.getQuizHistory(currentUser.uid, 200);
            const ids = new Set(history.map(h => h.quizId));
            setCompletedQuizIds(ids);
          } catch {}
          console.log('Quiz result saved successfully');
        } catch (error) {
          console.error('Error saving quiz result:', error);
        }
      }
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
  setSelectedAnswer(null);
  setAwardedBadges([]);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (reviewQuiz) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
          <TouchableOpacity onPress={() => { setReviewQuiz(null); setReviewAnswers([]); }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.quizTitle, { color: theme.text }]}>Review Quiz</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <QuizReview quiz={reviewQuiz} userAnswers={reviewAnswers} />
        </ScrollView>
      </View>
    );
  }

  if (currentQuiz && !showResult) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={resetQuiz} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.quizTitle, { color: theme.text }]}>{currentQuiz.title}</Text>
          <Text style={[styles.questionProgress, { color: theme.textMuted }]}>
            {currentQuestionIndex + 1}/{currentQuiz.questions.length}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.inputBackground }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`, backgroundColor: theme.primary }
            ]} 
          />
        </View>
        <ScrollView style={styles.questionContainer}>
          <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion.question}</Text>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                selectedAnswer === index && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
              ]}
              onPress={() => selectAnswer(index)}
            >
              <Text style={[
                styles.optionText,
                { color: theme.text },
                selectedAnswer === index && { color: theme.primary }
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity 
          style={[
            styles.nextButton, 
            { backgroundColor: theme.primary },
            selectedAnswer === null && styles.nextButtonDisabled
          ]}
          onPress={nextQuestion}
          disabled={selectedAnswer === null}
        >
          <Text style={[styles.nextButtonText, { color: '#000000' }]}>
            {currentQuestionIndex + 1 === currentQuiz.questions.length ? 'Finish Quiz' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / currentQuiz.questions.length) * 100);
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.resultContainer}>
          <Ionicons 
            name={percentage >= 70 ? "trophy" : "medal"} 
            size={64} 
            color={percentage >= 70 ? "#f59e0b" : "#6b7280"} 
          />
          <Text style={[styles.resultTitle, { color: theme.text }]}>Quiz Complete!</Text>
          <Text style={[styles.scoreText, { color: theme.text }]}>
            You scored {score} out of {currentQuiz.questions.length}
          </Text>
          <Text style={[styles.percentageText, { color: theme.primary }]}>{percentage}%</Text>
          {awardedBadges.length > 0 && (
            <View style={[styles.awardCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.awardTitle, { color: theme.text }]}>New Badge{awardedBadges.length > 1 ? 's' : ''} Earned</Text>
              {awardedBadges.map(b => (
                <View key={b.id} style={styles.awardRow}>
                  <View style={[styles.awardIcon, { backgroundColor: (b.color || '#4ade80') + '20' }]}>
                    <Ionicons name={b.icon || 'ribbon-outline'} size={20} color={b.color || '#4ade80'} />
                  </View>
                  <Text style={{ color: theme.text }}>{b.name}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.performanceBadge}>
            <Text style={[
              styles.performanceText,
              { color: percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444' }
            ]}>
              {percentage >= 70 ? 'Excellent!' : percentage >= 50 ? 'Good Job!' : 'Keep Learning!'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.inputBackground }]} onPress={() => startQuiz(currentQuiz)}>
            <Text style={[styles.retryButtonText, { color: theme.text }]}>Retake Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.homeButton, { borderColor: theme.primary, backgroundColor: theme.primary + '20' }]} onPress={resetQuiz}>
            <Text style={[styles.homeButtonText, { color: theme.primary }]}>Back to Quizzes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const availableQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id));
  const completedQuizzes = quizzes.filter(q => completedQuizIds.has(q.id));

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Quizzes & Challenges</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Test your cybersecurity knowledge</Text>
      </View>
      {completedQuizzes.length > 0 && (
        <View style={styles.quizzesContainer}>
          <Text style={[styles.sectionHeading, { color: theme.primary }]}>Completed</Text>
          {completedQuizzes.map((quiz) => (
            <View key={quiz.id} style={[styles.quizCard, styles.completedCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => startQuiz(quiz)}>
                <View style={styles.quizLeft}>
                  <View style={[styles.quizIcon, { backgroundColor: '#10b981' + '20' }]}> 
                    <Ionicons name="checkmark-done-outline" size={28} color="#10b981" />
                  </View>
                  <View style={styles.quizContent}>
                    <Text style={[styles.quizCardTitle, { color: theme.text }]}>{quiz.title}</Text>
                    <Text style={[styles.quizDescription, { color: theme.textMuted }]}>{quiz.description}</Text>
                    <View style={styles.quizMeta}>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quiz.difficulty) + '20' }]}> 
                        <Text style={[styles.difficultyText, { color: getDifficultyColor(quiz.difficulty) }]}> 
                          {quiz.difficulty}
                        </Text>
                      </View>
                      <Text style={[styles.completedLabel, { color: theme.primary }]}>Completed</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReviewQuiz(quiz)} style={{ marginLeft: 12 }}>
                <Ionicons name="eye-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.quizzesContainer}>
        {availableQuizzes.map((quiz) => (
          <TouchableOpacity
            key={quiz.id}
            style={[styles.quizCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => startQuiz(quiz)}
          >
            <View style={styles.quizLeft}>
              <View style={[styles.quizIcon, { backgroundColor: '#3b82f6' + '20' }]}>
                <Ionicons name="school-outline" size={32} color="#3b82f6" />
              </View>
              <View style={styles.quizContent}>
                <Text style={[styles.quizCardTitle, { color: theme.text }]}>{quiz.title}</Text>
                <Text style={[styles.quizDescription, { color: theme.textMuted }]}>{quiz.description}</Text>
                <View style={styles.quizMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quiz.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(quiz.difficulty) }]}>
                      {quiz.difficulty}
                    </Text>
                  </View>
                  <Text style={[styles.questionsCount, { color: theme.textSecondary }]}>{quiz.questions?.length || 0} questions</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
        <View style={[styles.tipsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
          <Text style={[styles.tipsTitle, { color: theme.text }]}>How to Get the Most Out of Quizzes</Text>
          <Text style={[styles.tipText, { color: theme.textMuted }]}>• Read each question carefully</Text>
          <Text style={[styles.tipText, { color: theme.textMuted }]}>• Use the review feature to revisit answers</Text>
          <Text style={[styles.tipText, { color: theme.textMuted }]}>• Earn badges for high scores</Text>
          <Text style={[styles.tipText, { color: theme.textMuted }]}>• Practice regularly to improve</Text>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  quizzesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeading: {
    fontSize: 16,
    marginBottom: 8,
  },
  quizCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quizIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quizContent: {
    flex: 1,
  },
  completedCard: {
    borderWidth: 2,
  },
  completedLabel: {
    fontSize: 12,
    marginLeft: 12,
    fontWeight: '600',
  },
  quizCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionsCount: {
    fontSize: 12,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  questionProgress: {
    fontSize: 16,
  },
  progressBar: {
    height: 4,
    marginHorizontal: 20,
  },
  progressFill: {
    height: '100%',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  nextButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 18,
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  awardCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  awardTitle: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  awardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 8,
  },
});

export default QuizzesScreen;
