import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Catches render errors in a subtree (e.g. WebGL unavailable) and shows a fallback with retry. */
export class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.warn('ErrorBoundary', error, info.componentStack);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
