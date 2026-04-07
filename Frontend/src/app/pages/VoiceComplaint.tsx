import React, { useState, useRef } from 'react';
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

type RecordingState = 'idle' | 'recording' | 'uploading' | 'done';

export default function VoiceComplaint() {
  const navigate = useNavigate();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isRecording = recordingState === 'recording';
  const isUploading = recordingState === 'uploading';
  const isDone = recordingState === 'done';

  const handleStartRecording = async () => {
    setPermissionError(null);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const error = err as Error;
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setPermissionError(
          'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        );
      } else if (error.name === 'NotFoundError') {
        setPermissionError(
          'No microphone found. Please connect a microphone and try again.'
        );
      } else {
        setPermissionError(
          'Could not access microphone. Please check your device settings.'
        );
      }
      return;
    }

    streamRef.current = stream;

    // Pick a supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      // Stop all tracks to release the mic
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const blob = new Blob(chunksRef.current, {
        type: mimeType || 'audio/webm',
      });

      await uploadAudio(blob, mimeType || 'audio/webm');
    };

    recorder.start();
    setRecordingState('recording');
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecordingState('uploading');
  };

  const uploadAudio = async (blob: Blob, mimeType: string) => {
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('audio_file', blob, `recording.${extension}`);

    try {
      const result = await api.upload<{ audio_url: string; transcript: string }>(
        '/api/complaints/audio-upload/',
        formData
      );
      setAudioUrl(result.audio_url);
      setTranscribedText(result.transcript);
      setRecordingState('done');
    } catch (err) {
      const error = err as Error;
      const msg = error.message ?? '';

      if (msg.includes('502') || msg.toLowerCase().includes('whisper')) {
        toast.error('Transcription service is temporarily unavailable. Please try again later.');
      } else if (msg.includes('400') && msg.toLowerCase().includes('large')) {
        toast.error('Recording is too large. Please keep recordings under the size limit.');
      } else if (msg.includes('400')) {
        toast.error('Unsupported audio format. Please try recording again.');
      } else {
        toast.error('Failed to upload recording. Please try again.');
      }

      // Reset so user can try again
      setRecordingState('idle');
    }
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
        text: transcribedText,
        audio_url: audioUrl,
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

        {/* Permission error */}
        {permissionError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {permissionError}
          </div>
        )}

        {/* Recording Button */}
        <div className="flex flex-col items-center justify-center mb-8">
          <motion.button
            whileHover={{ scale: isUploading || isDone ? 1 : 1.05 }}
            whileTap={{ scale: isUploading || isDone ? 1 : 0.95 }}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isUploading || isDone}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/50'
                : isDone
                ? 'bg-accent text-accent-foreground'
                : isUploading
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
            } ${isUploading || isDone ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isUploading ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : isRecording ? (
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
              ? 'Recording… Tap to stop'
              : isUploading
              ? 'Uploading & transcribing…'
              : isDone
              ? 'Recording complete'
              : 'Tap to start recording'}
          </p>

          {/* Upload/transcription progress indicator */}
          {isUploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing your audio with Whisper…</span>
            </div>
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
