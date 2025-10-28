import quizzesData from '../data/quizzes.json';
import badgesData from '../data/badges.json';
import habitsData from '../data/habits.json';

// Coordinates data from json files in data folder

export class LocalDataService {
  static getQuizzes() {
    return quizzesData.quizzes;
  }

  static getQuiz(quizId) {
    return quizzesData.quizzes.find(quiz => quiz.id === quizId);
  }

  static getQuizzesByCategory(category) {
    return quizzesData.quizzes.filter(quiz => quiz.category === category);
  }

  static getBadges() {
    return badgesData.badges;
  }

  static getBadge(badgeId) {
    return badgesData.badges.find(badge => badge.id === badgeId);
  }

  static getBadgesByCategory(category) {
    return badgesData.badges.filter(badge => badge.category === category);
  }

  static checkBadgeEligibility(badge, userProfile) {
    const { criteria } = badge;
    switch (criteria.type) {
      case 'quiz_completion':
        return (userProfile.quizzesTaken || 0) >= criteria.requirement;

      case 'habits_enabled':
        const enabledHabits = Object.values(userProfile.securityHabits || {}).filter(Boolean).length;
        return enabledHabits >= criteria.requirement;

      case 'total_points':
        return (userProfile.totalPoints || 0) >= criteria.requirement;

      case 'level_reached':
        return (userProfile.level || 1) >= criteria.requirement;

      case 'perfect_quiz_score':
        return false; 

      case 'activity_streak':
        return (userProfile.currentStreak || 0) >= criteria.requirement;

      case 'quiz_average':
        if (criteria.all_quizzes) {
          const totalQuizzes = this.getQuizzes().length;
          return (userProfile.quizzesTaken || 0) >= totalQuizzes && 
                 (userProfile.averageQuizScore || 0) >= criteria.requirement;
        }
        return (userProfile.averageQuizScore || 0) >= criteria.requirement;

      default:
        return false;
    }
  }

  static getEligibleBadges(userProfile) {
    return this.getBadges().filter(badge => 
      this.checkBadgeEligibility(badge, userProfile)
    );
  }

  static getAvailableBadges(userProfile) {
    const userBadgeIds = (userProfile.badges || []).map(b => b.id);
    return this.getBadges().filter(badge => 
      !userBadgeIds.includes(badge.id)
    );
  }

  static getSecurityTips() {
    return [
      "Enable two-factor authentication on your most important accounts today!",
      "Use a password manager to generate and store unique passwords.",
      "Keep your software and apps up to date with the latest security patches.",
      "Be cautious when clicking links in emails, even from known contacts.",
      "Regularly review your privacy settings on social media platforms.",
      "Use different passwords for different accounts to limit damage from breaches.",
      "Enable automatic updates for your operating system and applications.",
      "Be suspicious of unexpected phone calls asking for personal information.",
      "Use secure Wi-Fi networks and avoid public Wi-Fi for sensitive activities.",
      "Regularly backup your important data to multiple locations."
    ];
  }

  static getTipOfTheDay() {
    const tips = this.getSecurityTips();
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return tips[dayOfYear % tips.length];
  }

  static getSecurityHabits() {
    return habitsData.securityHabits;
  }

  static getSecurityHabit(habitId) {
    return habitsData.securityHabits.find(habit => habit.id === habitId);
  }

  static getHabitsByCategory(category) {
    return habitsData.securityHabits.filter(habit => habit.category === category);
  }

  static getHabitsByFrequency(frequency) {
    return habitsData.securityHabits.filter(habit => habit.frequency === frequency);
  }

  static shuffleArray(array, seed) {
    const shuffled = [...array];
    let currentSeed = seed;

    const seededRandom = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  static getDailyHabits(count = 3) {
    const dailyHabits = this.getHabitsByFrequency('daily');
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const shuffled = this.shuffleArray(dailyHabits, seed);
    return shuffled.slice(0, count);
  }

  static getMonthlyHabits(count = 2) {
    const monthlyHabits = this.getHabitsByFrequency('monthly');
    const today = new Date();
    const seed = today.getFullYear() * 100 + (today.getMonth() + 1);
    const shuffled = this.shuffleArray(monthlyHabits, seed);
    return shuffled.slice(0, count);
  }

  static getYearlyHabits(count = 1) {
    const yearlyHabits = this.getHabitsByFrequency('yearly');
    const today = new Date();
    const seed = today.getFullYear();
    const shuffled = this.shuffleArray(yearlyHabits, seed);
    return shuffled.slice(0, count);
  }

  static getTodaysHabits() {
    return [
      ...this.getDailyHabits(3),
      ...this.getMonthlyHabits(2),
      ...this.getYearlyHabits(1)
    ];
  }
}
