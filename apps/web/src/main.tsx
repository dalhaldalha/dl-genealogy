import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error in DL-Genealogy:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('dl_genealogy_tree_cache');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#09090b',
          color: '#f4f4f5',
          fontFamily: 'sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            padding: '32px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#C5A059', marginBottom: '12px' }}>
              DL-Genealogy Archive Notice
            </h2>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '20px', lineHeight: '1.6' }}>
              An unexpected render issue occurred while drawing the tree. You can clear the local cache and refresh to load the latest verified records from the database.
            </p>
            {this.state.error && (
              <pre style={{
                fontSize: '11px',
                color: '#f87171',
                backgroundColor: '#09090b',
                padding: '12px',
                borderRadius: '8px',
                overflowX: 'auto',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#C5A059',
                color: '#09090b',
                fontWeight: 'bold',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Reset Local Cache & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
