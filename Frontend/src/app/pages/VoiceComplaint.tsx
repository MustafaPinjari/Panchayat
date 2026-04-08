import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Mic, Square, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { api } from '../../services/api';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

type RecordingState = 'idle' | 'recording' | 'done';

export default function VoiceComplaint() {
  const navigate = useNavigate();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const interimRef = useRef<string>('');

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) setIsSupported(false);
  }, []);

  const isRecording = recordingState === 'recording';
  const isDone = recordingState === 'done';

  const handleStartRecording = () => {
    setPermissionError(null);
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setPermissionError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    interimRef.current = '';

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscribedText(final + interim);
      interimRef.current = interim;
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed') {
        setPermissionError('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else if (e.error === 'no-speech') {
        // ignore — user just paused
      } else {
        toast.error('Speech recognition error: ' + e.error);
      }
      setRecordingState('idle');
    };

    recognition.onend = () => {
      // Auto-finalize when recognition ends
      if (recordingState === 'recording') {
        setRecordingState('done');
      }
    };

    recognition.start();
    setRecordingState('recording');
  };

  const handleStopRecording = () => {
    recognitionRef.current?.stop();
    setRecordingState('done');
  };

  const handleSubmit = async () => {
    if (!transcribedText.trim()) {
      toast.error('Please provide complaint details');
      return;
    }
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/complaints/', {
        text: transcribedText.trim(),
        audio_url: null,
        category,
        anonymous: isAnonymous,
      });
      toast.success('Complaint submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message ?? 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Report Issue" />

      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Voice Your Concern</h2>
          <p className="text-muted-foreground">
            Tap the microphone to record your complaint
          </p>
        </div>

        {/* Browser support warning */}
        {!isSupported && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            Speech recognition is not supported in this browser. Please use Chrome or Edge.
          </div>
        )}

        {/* Permission error */}
        {permissionError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {permissionError}
          </div>
        )}

        {/* Recording Button */}
        <div className="flex flex-col items-center justify-center mb-8">
          <motion.button
            whileHover={{ scale: isDone ? 1 : 1.05 }}
            whileTap={{ scale: isDone ? 1 : 0.95 }}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isDone || !isSupported}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/50'
                : isDone
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
            } ${isDone || !isSupported ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isRecording ? (
              <Square className="w-12 h-12" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </motion.button>

          {/* Recording Animation */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 flex gap-1"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [20, 40, 20] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-primary rounded-full"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 text-sm text-muted-foreground">
            {isRecording
              ? 'Listening… Tap to stop'
              : isDone
              ? 'Recording complete'
              : 'Tap to start recording'}
          </p>

          {/* Live transcript preview while recording */}
          {isRecording && transcribedText && (
            <p className="mt-3 text-sm text-center text-muted-foreground italic max-w-sm">
              "{transcribedText}"
            </p>
          )}
        </div>

        {/* Transcribed Text & Submission Form */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="complaint">Complaint Details</Label>
                <Textarea
                  id="complaint"
                  value={transcribedText}
                  onChange={(e) => setTranscribedText(e.target.value)}
                  rows={6}
                  className="resize-none"
                  placeholder="Edit your complaint if needed…"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="noise">Noise</SelectItem>
                    <SelectItem value="cleanliness">Cleanliness</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous" className="cursor-pointer">
                    Post Anonymously
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Your identity will be hidden from other residents
                  </p>
                </div>
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Submitting…' : 'Submit Complaint'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
