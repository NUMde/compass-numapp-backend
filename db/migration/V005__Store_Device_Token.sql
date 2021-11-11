-- Add column to store device token for Firebase push notifications
ALTER TABLE studyparticipant
ADD COLUMN registration_token TEXT;
