import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Mic, Square, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

export default function VoiceComplaint() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<string>('');

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording for 3 seconds
    setTimeout(() => {
      setIsRecording(false);
      setHasRecorded(true);
      setTranscribedText(
        "There is a water leakage in the common area near the lift on the 5th floor. It's been leaking since this morning and the floor is getting slippery. This needs urgent attention."
      );
    }, 3000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);
    setTranscribedText(
      "There is a water leakage in the common area near the lift on the 5th floor."
    );
  };

  const handleSubmit = () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    toast.success('Complaint submitted successfully!');
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
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

        {/* Recording Button */}
        <div className="flex flex-col items-center justify-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={hasRecorded}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/50'
                : hasRecorded
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
            } ${hasRecorded ? 'cursor-not-allowed opacity-50' : ''}`}
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
                    animate={{
                      height: [20, 40, 20],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-1 bg-primary rounded-full"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 text-sm text-muted-foreground">
            {isRecording
              ? 'Recording... Tap to stop'
              : hasRecorded
              ? 'Recording complete'
              : 'Tap to start recording'}
          </p>
        </div>

        {/* Transcribed Text */}
        <AnimatePresence>
          {hasRecorded && (
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
                  placeholder="Edit your complaint if needed..."
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
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="infrastructure">
                      Infrastructure
                    </SelectItem>
                    <SelectItem value="garden">Garden</SelectItem>
                    <SelectItem value="parking">Parking</SelectItem>
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
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSubmit}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Complaint
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
