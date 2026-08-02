import React from 'react';
import { ErrorState } from './ErrorState';

/**
 * Root error boundary. Catches render-time crashes and presents a
 * recoverable error screen with a reload action.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || null };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <ErrorState
            title="Unexpected Error"
            message={this.state.message || 'Something went wrong while rendering this screen.'}
            retryLabel="Reload Application"
            onRetry={this.handleReload}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
