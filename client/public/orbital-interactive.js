// ===== ICON CLICK TO SHOW NAME =====
document.addEventListener('DOMContentLoaded', function() {
  
  // Icon Click Handler - Show name on click
  const socialIcons = document.querySelectorAll('.social-icon');
  
  socialIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get icon name from title attribute
      const iconName = this.getAttribute('title');
      
      // Remove any existing name display
      const existingDisplay = document.querySelector('.icon-name-display');
      if (existingDisplay) {
        existingDisplay.remove();
      }
      
      // Create and show name display
      const nameDisplay = document.createElement('div');
      nameDisplay.className = 'icon-name-display';
      nameDisplay.textContent = iconName;
      
      // Position near the icon
      const rect = this.getBoundingClientRect();
      nameDisplay.style.position = 'fixed';
      nameDisplay.style.left = rect.left + rect.width / 2 + 'px';
      nameDisplay.style.top = rect.top - 40 + 'px';
      nameDisplay.style.transform = 'translateX(-50%)';
      nameDisplay.style.padding = '8px 16px';
      nameDisplay.style.background = 'rgba(0, 0, 0, 0.9)';
      nameDisplay.style.color = '#00FFFF';
      nameDisplay.style.fontSize = '16px';
      nameDisplay.style.fontWeight = '600';
      nameDisplay.style.borderRadius = '8px';
      nameDisplay.style.border = '2px solid #00FFFF';
      nameDisplay.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
      nameDisplay.style.zIndex = '9999';
      nameDisplay.style.pointerEvents = 'none';
      nameDisplay.style.animation = 'fadeInScale 0.3s ease-out';
      
      document.body.appendChild(nameDisplay);
      
      // Remove after 2 seconds
      setTimeout(() => {
        nameDisplay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => nameDisplay.remove(), 300);
      }, 2000);
    });
  });
  
  // ===== SHOOTING STARS - USE CSS ANIMATIONS =====
  // Shooting stars now use pure CSS infinite animations
  // No JavaScript control needed - they run automatically via orbital.css
  // Star 1: 2s delay, 4s duration, infinite
  // Star 2: 5s delay, 3.5s duration, infinite  
  // Star 3: 8s delay, 4.5s duration, infinite
  
  // Add CSS animations for name display
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: translateX(-50%) scale(0.8);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
    }
    
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
});
