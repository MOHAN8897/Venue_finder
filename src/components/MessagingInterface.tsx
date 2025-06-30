import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- FAKE DATA ---
const conversations = [
  { id: 1, name: 'Admin Support', lastMessage: 'Yes, we can help with that.', timestamp: '10:45 AM', unread: 2, avatar: 'https://github.com/shadcn.png' },
  { id: 2, name: 'Billing Department', lastMessage: 'Your last payout was processed.', timestamp: 'Yesterday', unread: 0, avatar: 'https://github.com/shadcn.png' },
  { id: 3, name: 'Technical Team', lastMessage: 'We have resolved the issue with image uploads.', timestamp: 'Jul 28', unread: 0, avatar: 'https://github.com/shadcn.png' },
];

type Messages = {
    [key: number]: { from: 'me' | 'other'; text: string; timestamp: string }[];
};

const messages: Messages = {
  1: [
    { from: 'other', text: 'Hello, I have a question about my venue listing.', timestamp: '10:40 AM' },
    { from: 'me', text: 'Hi there, how can I help you today?', timestamp: '10:42 AM' },
    { from: 'other', text: 'I need to update my business license document, can you guide me?', timestamp: '10:44 AM' },
    { from: 'other', text: 'Yes, we can help with that.', timestamp: '10:45 AM' },
  ],
  2: [{ from: 'other', text: 'Your last payout was processed.', timestamp: 'Yesterday' }],
  3: [{ from: 'other', text: 'We have resolved the issue with image uploads.', timestamp: 'Jul 28' }],
};

const MessagingInterface: React.FC = () => {
    const [activeConversation, setActiveConversation] = useState(conversations[0].id);
    const [currentMessages, setCurrentMessages] = useState<Messages>(messages);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        
        const newMsg = {
            from: 'me',
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setCurrentMessages(prev => ({
            ...prev,
            [activeConversation]: [...(prev[activeConversation] || []), newMsg]
        }));
        
        setNewMessage('');
    };

    return (
        <Card className="h-[75vh] flex">
            {/* Conversation List */}
            <div className="w-1/3 border-r">
                <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <div className="p-2 space-y-1">
                    {conversations.map(convo => (
                        <div key={convo.id} 
                            className={cn("p-3 flex items-center space-x-3 rounded-lg cursor-pointer transition-colors",
                                activeConversation === convo.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                            )}
                            onClick={() => setActiveConversation(convo.id)}
                        >
                            <Avatar>
                                <AvatarImage src={convo.avatar} />
                                <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold text-sm">{convo.name}</p>
                                    <p className="text-xs text-gray-500">{convo.timestamp}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-xs text-gray-600 truncate">{convo.lastMessage}</p>
                                    {convo.unread > 0 && <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">{convo.unread}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="w-2/3 flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle>{conversations.find(c => c.id === activeConversation)?.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                     {(currentMessages[activeConversation] || []).map((msg, index) => (
                        <div key={index} className={cn("flex items-end max-w-lg", msg.from === 'me' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
                             <div className={cn("px-4 py-2 rounded-2xl", msg.from === 'me' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none')}>
                                <p>{msg.text}</p>
                                <p className={cn("text-xs mt-1", msg.from === 'me' ? 'text-blue-200' : 'text-gray-500')}>{msg.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <div className="p-4 border-t flex items-center space-x-2">
                    <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5"/></Button>
                    <Input 
                        placeholder="Type a message..." 
                        className="flex-1" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}><Send className="h-5 w-5"/></Button>
                </div>
            </div>
        </Card>
    );
};

export default MessagingInterface; 