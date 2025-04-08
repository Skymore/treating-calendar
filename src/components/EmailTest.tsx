import { useState } from 'react';
import { useEmailNotification } from '../hooks/useEmailNotification';

export default function EmailTest() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('Test Email');
  const [content, setContent] = useState('<p>This is a test email</p>');
  const [result, setResult] = useState<string | null>(null);
  
  const { sendNotification, loading, error } = useEmailNotification();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    
    try {
      const response = await sendNotification(
        recipient,
        subject,
        content
      );
      
      if (response.success) {
        console.log(JSON.stringify(response, null, 2))
        setResult(`Email sent successfully! Message ID: ${response.messageId || 'No ID'}`);
      } else {
        setResult(`Send failed: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Email Test</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Email</label>
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Content (HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-md h-32"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
          {result}
        </div>
      )}
    </div>
  );
} 