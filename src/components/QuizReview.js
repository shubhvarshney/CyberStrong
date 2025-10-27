import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const QuizReview = ({ quiz, userAnswers }) => {
  if (!quiz) return null;
  return (
    <View style={styles.reviewContainer}>
      <Text style={styles.reviewTitle}>Quiz Review: {quiz.title}</Text>
      {quiz.questions.map((q, idx) => {
        const userAnswer = userAnswers[idx];
        const isCorrect = userAnswer === q.correctAnswer;
        return (
          <View key={q.id} style={styles.questionBlock}>
            <Text style={styles.questionText}>{idx + 1}. {q.question}</Text>
            <Text style={[styles.answerText, isCorrect ? styles.correct : styles.incorrect]}>
              Your answer: {q.options[userAnswer] ?? 'No answer'}
            </Text>
            <Text style={styles.correctText}>
              Correct answer: {q.options[q.correctAnswer]}
            </Text>
            <Text style={styles.explanationText}>Explanation: {q.explanation}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default QuizReview;

const styles = StyleSheet.create({
  reviewContainer: {
    padding: 20,
    backgroundColor: '#23234b',
    borderRadius: 16,
    margin: 20,
  },
  reviewTitle: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionBlock: {
    marginBottom: 18,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
  },
  questionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  answerText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  correct: {
    color: '#10b981',
  },
  incorrect: {
    color: '#ef4444',
  },
  correctText: {
    color: '#4ade80',
    marginBottom: 2,
  },
  explanationText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
});
