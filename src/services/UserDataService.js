import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit as queryLimit,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { LocalDataService } from './LocalDataService';

export class UserDataService {
  static async initializeUserProfile(userId, userInfo) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        const initialProfile = {
          email: userInfo.email,
          displayName: userInfo.displayName || userInfo.email?.split('@')[0],
          photoURL: userInfo.photoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          totalPoints: 0,
          level: 1,
          badges: [],
          quizzesTaken: 0,
          totalQuizScore: 0,
          averageQuizScore: 0,
          securityHabits: {
            passwordManagerUsed: false,
            twoFactorEnabled: false,
            regularBreachChecks: false,
            securityUpdatesEnabled: false,
          },
          preferences: {
            notifications: true,
            theme: 'dark',
            reminderFrequency: 'weekly'
          }
        };
        await setDoc(userDocRef, initialProfile);
        console.log('User profile initialized for:', userId);
        return initialProfile;
      } else {
        await updateDoc(userDocRef, {
          lastLoginAt: serverTimestamp()
        });
        return userDoc.data();
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId, updates) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('User profile updated for:', userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async addPoints(userId, points, reason) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const newTotalPoints = userProfile.totalPoints + points;
      const newLevel = Math.floor(newTotalPoints / 500) + 1; 
      await this.updateUserProfile(userId, {
        totalPoints: newTotalPoints,
        level: newLevel
      });
      await this.logPointsTransaction(userId, points, reason);
      console.log(`Added ${points} points to user ${userId} for: ${reason}`);
      return { newTotalPoints, newLevel, pointsAdded: points };
    } catch (error) {
      console.error('Error adding points:', error);
      throw error;
    }
  }

  static async logPointsTransaction(userId, points, reason) {
    try {
      const transactionRef = collection(db, 'users', userId, 'pointsHistory');
      await addDoc(transactionRef, {
        points,
        reason,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging points transaction:', error);
    }
  }

  static async saveQuizResult(userId, quizData) {
    try {
      const quizRef = collection(db, 'users', userId, 'quizResults');
      const result = await addDoc(quizRef, {
        ...quizData,
        timestamp: serverTimestamp(),
        answers: quizData.answers || [],
      });
      const userProfile = await this.getUserProfile(userId);
      const newQuizzesTaken = userProfile.quizzesTaken + 1;
      const newTotalScore = userProfile.totalQuizScore + quizData.score;
      const newAverageScore = newTotalScore / newQuizzesTaken;
      await this.updateUserProfile(userId, {
        quizzesTaken: newQuizzesTaken,
        totalQuizScore: newTotalScore,
        averageQuizScore: Math.round(newAverageScore * 100) / 100
      });
      let pointsAwarded = Math.floor(quizData.score * 5); 
      let awardedBadges = [];
      if (quizData.score === quizData.totalQuestions) {
        pointsAwarded += 25; 
        try {
          const perfectBadge = LocalDataService.getBadge?.('perfect_score');
          if (perfectBadge) {
            const added = await this.addBadge(userId, perfectBadge);
            if (added) awardedBadges.push(perfectBadge);
          }
        } catch (e) {
          console.warn('Optional perfect score badge check failed:', e?.message);
        }
      }
      await this.addPoints(userId, pointsAwarded, `Quiz completed: ${quizData.quizName}`);
      const newlyAwarded = await this.evaluateAndAwardBadges(userId);
      if (Array.isArray(newlyAwarded) && newlyAwarded.length) {
        awardedBadges = awardedBadges.concat(newlyAwarded);
      }
      console.log('Quiz result saved for user:', userId);
      return { id: result.id, awardedBadges };
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  }

  static async evaluateAndAwardBadges(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const available = LocalDataService.getAvailableBadges(userProfile);
      const eligibleToAward = available.filter(badge => LocalDataService.checkBadgeEligibility(badge, userProfile));
      const actuallyAwarded = [];
      for (const badge of eligibleToAward) {
        const added = await this.addBadge(userId, badge);
        if (added) actuallyAwarded.push(badge);
      }
      return actuallyAwarded;
    } catch (error) {
      console.error('Error evaluating badges:', error);
      return [];
    }
  }

  static async getQuizHistory(userId, max = 10) {
    try {
      const quizRef = collection(db, 'users', userId, 'quizResults');
      const q = query(quizRef, orderBy('timestamp', 'desc'), queryLimit(max ?? 200));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting quiz history:', error);
      throw error;
    }
  }

  static async updateSecurityHabit(userId, habitName, value) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const updatedHabits = {
        ...userProfile.securityHabits,
        [habitName]: value
      };
      await this.updateUserProfile(userId, {
        securityHabits: updatedHabits
      });
      if (value === true) {
        await this.addPoints(userId, 10, `Enabled security habit: ${habitName}`); 
      }
      console.log(`Security habit ${habitName} updated to ${value} for user:`, userId);
      await this.evaluateAndAwardBadges(userId);
    } catch (error) {
      console.error('Error updating security habit:', error);
      throw error;
    }
  }

  static async addBadge(userId, badgeData) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const existingBadge = userProfile.badges.find(badge => badge.id === badgeData.id);
      if (!existingBadge) {
        const badgeToAdd = {
          ...badgeData,
          earnedAt: Date.now(),
        };
        if (badgeData.score !== undefined) {
          badgeToAdd.score = badgeData.score;
        }
        const updatedBadges = [...userProfile.badges, badgeToAdd];
        await this.updateUserProfile(userId, {
          badges: updatedBadges
        });
        await this.addPoints(userId, badgeData.points || 100, `Earned badge: ${badgeData.name}`);
        console.log(`Badge ${badgeData.name} added to user:`, userId, 'Score:', badgeData.score);
        return true;
      }
      return false; 
    } catch (error) {
      console.error('Error adding badge:', error);
      throw error;
    }
  }

  static async getLeaderboard(limit = 10) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('totalPoints', 'desc'), queryLimit(limit ?? 20));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc, index) => ({
        rank: index + 1,
        userId: doc.id,
        displayName: doc.data().displayName,
        totalPoints: doc.data().totalPoints,
        level: doc.data().level,
        badges: doc.data().badges?.length || 0
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
  
  static async getDashboardData(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const recentQuizzes = await this.getQuizHistory(userId, 3);
      const habits = userProfile.securityHabits;
      const securityScore = Object.values(habits).filter(Boolean).length / Object.keys(habits).length * 100;
      return {
        profile: userProfile,
        recentQuizzes,
        securityScore: Math.round(securityScore),
        stats: {
          totalPoints: userProfile.totalPoints,
          level: userProfile.level,
          badgesCount: userProfile.badges?.length || 0,
          quizzesTaken: userProfile.quizzesTaken,
          averageQuizScore: userProfile.averageQuizScore
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }
}
