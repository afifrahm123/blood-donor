// AI-powered urgency level detection service
export class UrgencyAI {
  
  // Keywords that indicate critical urgency
  static criticalKeywords = [
    'accident', 'emergency', 'critical', 'urgent', 'immediate', 'trauma',
    'bleeding', 'hemorrhage', 'shock', 'unconscious', 'life-threatening',
    'severe', 'acute', 'crash', 'injury', 'wound', 'stab', 'gunshot',
    'burn', 'drowning', 'heart attack', 'stroke', 'seizure'
  ];

  // Keywords that indicate high urgency
  static highKeywords = [
    'operation', 'surgery', 'delivery', 'birth', 'labor', 'cesarean',
    'transplant', 'procedure', 'treatment', 'therapy', 'dialysis',
    'chemotherapy', 'radiation', 'infusion', 'transfusion'
  ];

  // Keywords that indicate medium urgency
  static mediumKeywords = [
    'scheduled', 'planned', 'routine', 'checkup', 'examination',
    'consultation', 'follow-up', 'monitoring', 'observation'
  ];

  // Determine urgency level based on reason and required date
  static determineUrgency(reason, requiredByDate) {
    const reasonLower = reason.toLowerCase();
    const today = new Date();
    const requiredDate = new Date(requiredByDate);
    const daysDifference = Math.ceil((requiredDate - today) / (1000 * 60 * 60 * 24));

    // Check for critical keywords first
    if (this.criticalKeywords.some(keyword => reasonLower.includes(keyword))) {
      return 'critical'; 
    }

    // Check for high urgency keywords
    if (this.highKeywords.some(keyword => reasonLower.includes(keyword))) {
      // If required today or tomorrow, it's high urgency
      if (daysDifference <= 1) {
        return 'high';
      }
      // If required within 3 days, it's medium urgency
      else if (daysDifference <= 3) {
        return 'medium';
      }
      // If required after 3 days, it's low urgency
      else {
        return 'low';
      }
    }

    // Check for medium urgency keywords
    if (this.mediumKeywords.some(keyword => reasonLower.includes(keyword))) {
      if (daysDifference <= 3) {
        return 'medium';
      } else {
        return 'low';
      }
    }

    // Default logic based on time
    if (daysDifference <= 1) {
      return 'high';
    } else if (daysDifference <= 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // urgency explanation
  static getUrgencyExplanation(reason, requiredByDate) {
    const urgency = this.determineUrgency(reason, requiredByDate);
    const reasonLower = reason.toLowerCase();
    
    let explanation = `AI detected ${urgency} urgency based on: `;
    
    if (this.criticalKeywords.some(keyword => reasonLower.includes(keyword))) {
      explanation += `Critical keywords found in reason (${urgency} urgency)`;
    } else if (this.highKeywords.some(keyword => reasonLower.includes(keyword))) {
      const daysDifference = Math.ceil((new Date(requiredByDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysDifference <= 1) {
        explanation += `High urgency keywords + required within 1 day`;
      } else if (daysDifference <= 3) {
        explanation += `High urgency keywords + required within 3 days`;
      } else {
        explanation += `High urgency keywords + required after 3 days`;
      }
    } else {
      const daysDifference = Math.ceil((new Date(requiredByDate) - new Date()) / (1000 * 60 * 60 * 24));
      explanation += `Time-based urgency: required in ${daysDifference} days`;
    }
    
    return explanation;
  }

  // Get urgency color for UI
  static getUrgencyColor(urgency) {
    switch (urgency) {
      case 'critical':
        return '#dc3545'; // Red
      case 'high':
        return '#fd7e14'; // Orange
      case 'medium':
        return '#ffc107'; // Yellow
      case 'low':
        return '#28a745'; // Green
      default:
        return '#6c757d'; // Gray
    }
  }

  // Get urgency icon
  static getUrgencyIcon(urgency) {
    switch (urgency) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return '📋';
      default:
        return '❓';
    }
  }
}
