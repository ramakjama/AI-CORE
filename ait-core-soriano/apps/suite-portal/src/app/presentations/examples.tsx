"use client";

/**
 * Presentations Module - Usage Examples
 *
 * This file contains example code snippets for using the Presentations module.
 * These are for reference only and are not imported into the main application.
 */

import { presentationsApi } from '@/lib/api';

// ============================================================================
// Example 1: Creating a New Presentation
// ============================================================================

export const createPresentationExample = async () => {
  const newPresentation = await presentationsApi.post('/', {
    title: 'Sales Report Q1 2024',
    theme: 'league',
    slides: [
      {
        id: '1',
        content: '<h1>Sales Report</h1><p>Q1 2024</p>',
        layout: 'title',
        transition: 'slide',
        notes: 'Welcome everyone to the Q1 sales review',
      },
      {
        id: '2',
        content: '<h2>Key Metrics</h2><ul><li>Revenue: $1.2M</li><li>Growth: 15%</li><li>New Customers: 234</li></ul>',
        layout: 'content',
        transition: 'fade',
        notes: 'Highlight the strong growth in revenue',
      },
      {
        id: '3',
        content: '<h2>Revenue Breakdown</h2><div class="chart-container"></div>',
        layout: 'content',
        transition: 'slide',
        notes: 'Show the pie chart of revenue by product line',
      },
    ],
  });

  console.log('Created presentation:', newPresentation);
  return newPresentation;
};

// ============================================================================
// Example 2: Loading and Editing a Presentation
// ============================================================================

export const loadAndEditPresentationExample = async (presentationId: string) => {
  // Load presentation
  const presentation = await presentationsApi.get(`/${presentationId}`);

  // Add a new slide
  const updatedSlides = [
    ...presentation.slides,
    {
      id: Date.now().toString(),
      content: '<h2>New Slide</h2><p>Additional content</p>',
      layout: 'content',
      transition: 'zoom',
      notes: 'This is a new slide added programmatically',
    },
  ];

  // Update presentation
  const updated = await presentationsApi.patch(`/${presentationId}`, {
    slides: updatedSlides,
  });

  console.log('Updated presentation:', updated);
  return updated;
};

// ============================================================================
// Example 3: Custom Slide Layouts
// ============================================================================

export const customSlideLayouts = {
  // Title slide with company branding
  titleSlide: {
    id: 'title-1',
    content: `
      <div style="text-align: center; padding: 4rem;">
        <h1 style="font-size: 4rem; margin-bottom: 1rem;">Company Name</h1>
        <h2 style="font-size: 2rem; color: #888;">Product Launch 2024</h2>
        <p style="margin-top: 2rem; font-size: 1.2rem;">Presented by John Doe</p>
      </div>
    `,
    layout: 'title',
    notes: 'Opening slide - wait for everyone to settle in',
  },

  // Two column with image and text
  twoColumnSlide: {
    id: 'two-col-1',
    content: `
      <div style="display: flex; gap: 2rem; align-items: center; height: 100%;">
        <div style="flex: 1;">
          <img src="https://via.placeholder.com/500x400" alt="Product" style="width: 100%; border-radius: 8px;">
        </div>
        <div style="flex: 1;">
          <h2>Key Features</h2>
          <ul style="font-size: 1.2rem; line-height: 2;">
            <li>Fast Performance</li>
            <li>Easy Integration</li>
            <li>Secure by Design</li>
            <li>24/7 Support</li>
          </ul>
        </div>
      </div>
    `,
    layout: 'two-column',
    notes: 'Emphasize the security features',
  },

  // Quote slide
  quoteSlide: {
    id: 'quote-1',
    content: `
      <div style="text-align: center; padding: 4rem;">
        <blockquote style="font-size: 2.5rem; font-style: italic; margin-bottom: 2rem;">
          "This product changed how we do business."
        </blockquote>
        <p style="font-size: 1.5rem; color: #888;">- CEO, Fortune 500 Company</p>
      </div>
    `,
    layout: 'content',
    notes: 'Powerful testimonial from major client',
  },

  // Stats slide with grid
  statsSlide: {
    id: 'stats-1',
    content: `
      <div style="padding: 2rem;">
        <h2 style="text-align: center; margin-bottom: 3rem;">By The Numbers</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; text-align: center;">
          <div>
            <div style="font-size: 4rem; font-weight: bold; color: #3B82F6;">1.2M</div>
            <div style="font-size: 1.5rem; color: #888;">Users</div>
          </div>
          <div>
            <div style="font-size: 4rem; font-weight: bold; color: #10B981;">99.9%</div>
            <div style="font-size: 1.5rem; color: #888;">Uptime</div>
          </div>
          <div>
            <div style="font-size: 4rem; font-weight: bold; color: #F59E0B;">24/7</div>
            <div style="font-size: 1.5rem; color: #888;">Support</div>
          </div>
        </div>
      </div>
    `,
    layout: 'content',
    notes: 'These stats are impressive - pause for effect',
  },

  // Call to action slide
  ctaSlide: {
    id: 'cta-1',
    content: `
      <div style="text-align: center; padding: 4rem;">
        <h2 style="font-size: 3rem; margin-bottom: 2rem;">Ready to Get Started?</h2>
        <p style="font-size: 1.5rem; margin-bottom: 3rem;">Join thousands of satisfied customers</p>
        <div style="display: flex; gap: 2rem; justify-content: center;">
          <button style="padding: 1rem 3rem; font-size: 1.5rem; background: #3B82F6; color: white; border: none; border-radius: 8px; cursor: pointer;">
            Start Free Trial
          </button>
          <button style="padding: 1rem 3rem; font-size: 1.5rem; background: transparent; color: white; border: 2px solid white; border-radius: 8px; cursor: pointer;">
            Schedule Demo
          </button>
        </div>
      </div>
    `,
    layout: 'content',
    notes: 'End with a strong call to action',
  },
};

// ============================================================================
// Example 4: Chart Integration
// ============================================================================

export const chartExamples = {
  // Line chart for trends
  lineChart: {
    type: 'line' as const,
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [65000, 75000, 82000, 91000, 98000, 110000],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Costs',
          data: [45000, 48000, 51000, 53000, 55000, 58000],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Revenue vs Costs Trend',
        },
      },
    },
  },

  // Bar chart for comparisons
  barChart: {
    type: 'bar' as const,
    data: {
      labels: ['Product A', 'Product B', 'Product C', 'Product D'],
      datasets: [
        {
          label: 'Q1',
          data: [12000, 19000, 15000, 22000],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
        {
          label: 'Q2',
          data: [15000, 22000, 18000, 25000],
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Sales by Product & Quarter',
        },
      },
    },
  },

  // Pie chart for distribution
  pieChart: {
    type: 'pie' as const,
    data: {
      labels: ['North America', 'Europe', 'Asia', 'Other'],
      datasets: [
        {
          data: [45, 30, 20, 5],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(156, 163, 175, 0.8)',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Revenue by Region',
        },
      },
    },
  },
};

// ============================================================================
// Example 5: Theme Customization
// ============================================================================

export const themeCustomization = {
  // Custom CSS for specific slides
  customTheme: `
    .reveal h1 {
      color: #3B82F6;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .reveal h2 {
      color: #10B981;
    }

    .reveal section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .reveal ul li {
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .reveal .chart-container {
      background: white;
      border-radius: 8px;
      padding: 2rem;
    }
  `,

  // Apply custom theme to presentation
  applyCustomTheme: (presentationId: string) => {
    return presentationsApi.patch(`/${presentationId}`, {
      theme: 'custom',
      customCSS: themeCustomization.customTheme,
    });
  },
};

// ============================================================================
// Example 6: Presenter Mode Integration
// ============================================================================

export const presenterModeExample = {
  // Open presenter view in new window
  openPresenterMode: (slides: any[], theme: string, transition: string) => {
    const presenterWindow = window.open('', '_blank', 'width=1920,height=1080');

    if (!presenterWindow) {
      alert('Please allow popups for presenter mode');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Presenter View</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/${theme}.css">
          <style>
            body { margin: 0; background: #000; color: #fff; }
            .presenter-view { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; padding: 2rem; height: 100vh; }
            .current-slide { background: #222; border-radius: 8px; overflow: hidden; }
            .sidebar { display: flex; flex-direction: column; gap: 2rem; }
            .next-slide { background: #222; border-radius: 8px; padding: 1rem; height: 300px; }
            .notes { background: #222; border-radius: 8px; padding: 1rem; flex: 1; overflow-y: auto; }
            .timer { background: #3B82F6; padding: 1rem; border-radius: 8px; text-align: center; font-size: 2rem; }
          </style>
        </head>
        <body>
          <div class="presenter-view">
            <div class="current-slide">
              <div class="reveal">
                <div class="slides">
                  ${slides.map(slide => `
                    <section data-transition="${slide.transition || transition}">
                      ${slide.content}
                    </section>
                  `).join('')}
                </div>
              </div>
            </div>
            <div class="sidebar">
              <div class="timer" id="timer">00:00</div>
              <div class="next-slide">
                <h3>Next Slide</h3>
                <div id="next-preview"></div>
              </div>
              <div class="notes">
                <h3>Notes</h3>
                <div id="notes-content"></div>
              </div>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
          <script>
            let seconds = 0;
            setInterval(() => {
              seconds++;
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              document.getElementById('timer').textContent =
                String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            }, 1000);

            Reveal.initialize({
              controls: true,
              progress: true,
              center: true,
              hash: true,
              transition: '${transition}',
            });

            // Update notes on slide change
            Reveal.on('slidechanged', (event) => {
              const notes = event.currentSlide.dataset.notes || 'No notes for this slide';
              document.getElementById('notes-content').textContent = notes;
            });
          </script>
        </body>
      </html>
    `;

    presenterWindow.document.write(html);
    presenterWindow.document.close();
  },
};

// ============================================================================
// Example 7: Export Functions
// ============================================================================

export const exportExamples = {
  // Export to PDF
  exportToPDF: async (presentationId: string) => {
    try {
      const response = await presentationsApi.get(`/${presentationId}/export?format=pdf`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `presentation-${presentationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('PDF export failed:', error);
      return false;
    }
  },

  // Export to PPTX
  exportToPPTX: async (presentationId: string) => {
    try {
      const response = await presentationsApi.get(`/${presentationId}/export?format=pptx`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `presentation-${presentationId}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('PPTX export failed:', error);
      return false;
    }
  },
};

// ============================================================================
// Example 8: Keyboard Shortcuts
// ============================================================================

export const keyboardShortcuts = {
  // Set up keyboard shortcuts
  setupShortcuts: () => {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log('Save presentation');
        // Trigger save function
      }

      // Ctrl/Cmd + N: New slide
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        console.log('Add new slide');
        // Trigger add slide function
      }

      // Ctrl/Cmd + D: Duplicate slide
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        console.log('Duplicate slide');
        // Trigger duplicate function
      }

      // Delete: Delete slide
      if (e.key === 'Delete' && e.shiftKey) {
        e.preventDefault();
        console.log('Delete slide');
        // Trigger delete function
      }

      // F5: Present
      if (e.key === 'F5') {
        e.preventDefault();
        console.log('Start presentation');
        // Trigger present mode
      }
    });
  },
};

// ============================================================================
// Example 9: Auto-save Implementation
// ============================================================================

export const autoSaveExample = {
  // Auto-save presentation every 30 seconds
  setupAutoSave: (presentationId: string, getState: () => any) => {
    const AUTOSAVE_INTERVAL = 30000; // 30 seconds

    const interval = setInterval(async () => {
      try {
        const state = getState();
        await presentationsApi.patch(`/${presentationId}`, {
          title: state.title,
          slides: state.slides,
          theme: state.theme,
        });
        console.log('Auto-saved at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, AUTOSAVE_INTERVAL);

    // Return cleanup function
    return () => clearInterval(interval);
  },
};

// ============================================================================
// Example 10: Slide Transitions Demo
// ============================================================================

export const transitionExamples = {
  // Different transitions for different slide types
  transitions: {
    title: 'zoom',      // Zoom in for title slides
    content: 'slide',   // Standard slide for content
    quote: 'fade',      // Fade for quotes
    stats: 'convex',    // Convex for data/stats
    cta: 'concave',     // Concave for call-to-action
  },

  // Apply transitions based on slide type
  applyTransitions: (slides: any[]) => {
    return slides.map(slide => ({
      ...slide,
      transition: transitionExamples.transitions[slide.layout as keyof typeof transitionExamples.transitions] || 'slide',
    }));
  },
};
