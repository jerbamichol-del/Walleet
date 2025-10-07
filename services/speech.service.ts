import { SpeechRecognition } from '@capacitor-community/speech-recognition';

export const SpeechService = {
  async checkPermission() {
    try {
      const permission = await SpeechRecognition.requestPermissions();
      return permission;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  },

  async startListening() {
    try {
      const result = await SpeechRecognition.start({
        language: 'it-IT',
        prompt: 'Parla ora',
        partialResults: false,
      });
      return result;
    } catch (err) {
      console.error('Speech recognition error:', err);
      return null;
    }
  },

  async stopListening() {
    try {
      await SpeechRecognition.stop();
    } catch (err) {
      console.error('Stop error:', err);
    }
  }
};
