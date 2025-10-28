import { Alert, Platform } from 'react-native';

const getApiBaseUrl = () => {
  return 'https://passwords.xposedornot.com/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Connects with the XposedOrNot API and follows documentation to get relevant data

export class XposedOrNotAPI {
  static async checkEmail(email) {
    const fullUrl = `${API_BASE_URL}/breach-analytics?email=${encodeURIComponent(email)}`;
    console.log('=== API DEBUG INFO ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Full URL being fetched:', fullUrl);
    console.log('Platform:', Platform.OS);
    if (typeof window !== 'undefined') {
      console.log('Current window hostname:', window.location.hostname);
    }
    console.log('======================');
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const fetchPromise = fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('Response status:', response.status);
      console.log('Response URL:', response.url);
      if (!response.ok) {
        console.log('Response not OK. Status:', response.status);
        if (response.status === 404) {
          console.log('404 - Email not found in breaches');
          return {
            email,
            breached: false,
            breaches: [],
            checkedAt: new Date().toISOString()
          };
        }
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (data.Error && data.Error === "Not found") {
        return {
          email,
          breached: false,
          breaches: [],
          checkedAt: new Date().toISOString()
        };
      }

      if (data.ExposedBreaches && data.ExposedBreaches.breaches_details && Array.isArray(data.ExposedBreaches.breaches_details)) {
        const transformedBreaches = data.ExposedBreaches.breaches_details.map(breach => {
          let exposedDataArray = ['Email addresses']; 
          if (breach.xposed_data) {
            try {
              exposedDataArray = breach.xposed_data.split(';').map(item => item.trim()).filter(item => item);
            } catch (e) {
              exposedDataArray = [String(breach.xposed_data)];
            }
          }
    
          let formattedDate = 'Unknown';
          if (breach.xposed_date) {
            try {
              formattedDate = breach.xposed_date;
            } catch (e) {
              formattedDate = breach.xposed_date;
            }
          }

          return {
            name: breach.breach || breach.domain || 'Unknown Breach',
            date: formattedDate,
            description: breach.details || `Data breach involving ${breach.breach || 'unknown service'}`,
            severity: this.calculateSeverity(exposedDataArray),
            compromisedData: exposedDataArray,
            breachID: breach.breach ? breach.breach.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'unknown',
            exposedRecords: breach.xposed_records || 'Unknown',
            industry: breach.industry || 'Unknown',
            logo: breach.logo,
            verified: breach.verified === 'Yes',
            domain: breach.domain,
            passwordRisk: breach.password_risk
          };
        });

        return {
          email: data.email || email,
          breached: transformedBreaches.length > 0,
          breaches: transformedBreaches,
          checkedAt: new Date().toISOString()
        };
      }

      if (data.BreachesSummary && Array.isArray(data.BreachesSummary)) {
        const transformedBreaches = data.BreachesSummary.map(breachName => {
          const name = String(breachName || 'Unknown');
          return {
            name: name,
            date: 'Unknown',
            description: `Your email was found in the ${name} data breach.`,
            severity: 'medium',
            compromisedData: ['Email addresses'],
            breachID: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            exposedRecords: 'Unknown'
          };
        });
        return {
          email: data.email || email,
          breached: transformedBreaches.length > 0,
          breaches: transformedBreaches,
          checkedAt: new Date().toISOString()
        };
      }

      return {
        email: data.email || email,
        breached: false,
        breaches: [],
        checkedAt: new Date().toISOString()
      };

      } catch (error) {
      console.error('Error checking email with XposedOrNot API:', error);
      if (__DEV__) {
        Alert.alert(
          'API Error', 
          `Could not check breaches for this email. The XposedOrNot API might be temporarily unavailable.\n\nError: ${error.message}`,
          [{ text: 'OK' }]
        );
      }

      return {
        email,
        breached: false,
        breaches: [],
        checkedAt: new Date().toISOString(),
        error: 'API temporarily unavailable'
      };
    }
  }

  static calculateSeverity(exposedData) {
    if (!exposedData) return 'medium';
    const dataTypes = Array.isArray(exposedData) ? exposedData.join(' ').toLowerCase() : String(exposedData).toLowerCase();
    if (dataTypes.includes('password') || dataTypes.includes('credit card') || dataTypes.includes('ssn') || 
        dataTypes.includes('social security') || dataTypes.includes('payment') || dataTypes.includes('financial')) {
      return 'high';
    } else if (dataTypes.includes('email') || dataTypes.includes('phone') || dataTypes.includes('address') ||
               dataTypes.includes('name') || dataTypes.includes('personal')) {
      return 'medium';
    }
    return 'low';
  }
  
  static async getBreachesByDomain(domain) {
    try {
      const response = await fetch(`${API_BASE_URL}/breaches?domain=${encodeURIComponent(domain)}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting breaches by domain:', error);
      throw error;
    }
  }
}
