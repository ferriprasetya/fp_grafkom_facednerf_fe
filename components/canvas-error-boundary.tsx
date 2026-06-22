"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "WebGL context error";
    return { hasError: true, message };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[CanvasErrorBoundary]", error, info);
  }

  recover = () => this.setState({ hasError: false, message: "" });

  override render() {
    if (this.state.hasError) {
      return (
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground'>
          <AlertCircle className='size-8 text-destructive opacity-60' />
          <p className='text-sm'>{this.state.message}</p>
          <Button variant='outline' size='sm' onClick={this.recover}>
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

