'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Ticket } from '@/types/Project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
}

interface TicketWithProject extends Ticket {
  projectId: string;
  projectName: string;
}

interface TicketChatProps {
  ticket: TicketWithProject;
}

export function TicketChat({ ticket }: TicketChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticket.projectId || !ticket.id) return;

    const messagesRef = collection(db, 'projects', ticket.projectId, 'tickets', ticket.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content,
          senderId: data.senderId,
          senderName: data.senderName,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Message;
      });

      setMessages(messagesData);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [ticket.id, ticket.projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !ticket.projectId || !ticket.id) return;

    const messagesRef = collection(db, 'projects', ticket.projectId, 'tickets', ticket.id, 'messages');
    await addDoc(messagesRef, {
      content: newMessage.trim(),
      senderId: user.uid,
      senderName: user.name || 'Usuario',
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Sin fecha';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      });
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha inválida';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">{ticket.title}</h2>
        <p className="text-sm text-gray-500">Proyecto: {ticket.projectName}</p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.uid ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === user?.uid
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {message.senderId === user?.uid ? 'Tú' : message.senderName}
                  </span>
                  <span className="text-xs opacity-70">
                    {formatDate(message.createdAt?.toString())}
                  </span>
                </div>
                <p className="mt-1">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
