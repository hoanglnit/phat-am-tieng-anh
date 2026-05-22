import { useState, useRef, useCallback, useEffect } from 'react';

const TIMEOUT_MS = 10000; // 10 seconds max recording

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback((onResult) => {
    if (!isSupported) {
      setError('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome hoặc Edge.');
      return;
    }

    // Stop any existing recognition
    cleanup();
    setError(null);
    setTranscript('');
    setConfidence(0);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      // Clear timeout since we got a result
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Find best result across all alternatives
      let bestTranscript = '';
      let bestConfidence = 0;

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j++) {
          const alt = result[j];
          if (alt.confidence > bestConfidence) {
            bestConfidence = alt.confidence;
            bestTranscript = alt.transcript;
          }
        }
      }

      // Fallback to first result if no confidence data
      if (!bestTranscript && event.results[0]?.[0]) {
        bestTranscript = event.results[0][0].transcript;
        bestConfidence = event.results[0][0].confidence || 0;
      }

      setTranscript(bestTranscript);
      setConfidence(bestConfidence);
      setIsRecording(false);

      if (onResult) {
        onResult(bestTranscript, bestConfidence);
      }
    };

    recognition.onerror = (event) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      let errorMsg = 'Đã xảy ra lỗi khi nhận dạng giọng nói.';

      switch (event.error) {
        case 'no-speech':
          errorMsg = 'Không nghe thấy giọng nói. Hãy nói to hơn nhé!';
          break;
        case 'audio-capture':
          errorMsg = 'Không tìm thấy microphone. Vui lòng kiểm tra lại.';
          break;
        case 'not-allowed':
          errorMsg = 'Bạn chưa cho phép dùng microphone. Vui lòng cấp quyền trong trình duyệt.';
          break;
        case 'network':
          errorMsg = 'Lỗi mạng. Vui lòng kiểm tra kết nối internet.';
          break;
        case 'aborted':
          // Aborted intentionally, no error to show
          setIsRecording(false);
          return;
        default:
          errorMsg = `Lỗi: ${event.error}. Hãy thử lại nhé!`;
      }

      setError(errorMsg);
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };

    // Start recognition
    try {
      recognition.start();

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
          setError('Hết thời gian. Hãy nói nhanh hơn nhé!');
        }
      }, TIMEOUT_MS);
    } catch (e) {
      setError('Không thể bắt đầu ghi âm. Hãy thử lại!');
      setIsRecording(false);
    }
  }, [isSupported, cleanup]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    cleanup();
  }, [cleanup]);

  return {
    isRecording,
    isSupported,
    transcript,
    confidence,
    startRecording,
    stopRecording,
    error,
    clearError: () => setError(null),
  };
}
