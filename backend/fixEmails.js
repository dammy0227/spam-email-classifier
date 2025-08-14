import 'dotenv/config';
import mongoose from 'mongoose';
import { Email } from './models/Email.js';

async function inspectEmails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const emails = await Email.find({});
    console.log(`Found ${emails.length} emails:\n`);

    emails.forEach(email => {
      console.log(`Email ID: ${email._id}`);
      console.log(`Sender: ${email.senderId} (${email.from})`);
      console.log(`Recipient: ${email.recipientId} (${email.to})`);
      console.log('Current folderByUser:', email.folderByUser);
      console.log('----------------------------------------');
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

inspectEmails();