import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Clock, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  created_at: string;
  read_at: string | null;
  message_type: string;
  sender_profile?: {
    full_name: string;
    avatar_url: string;
  } | null;
}

interface CreatorMessagingProps {
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
}

export function CreatorMessaging({ creatorId, creatorName, creatorAvatar }: CreatorMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && creatorId) {
      fetchMessages();
    }
  }, [user, creatorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('creator_messages')
        .select(`
          *,
          sender_profile:profiles!creator_messages_sender_id_fkey(full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${creatorId}),and(sender_id.eq.${creatorId},recipient_id.eq.${user?.id})`)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Type assertion to handle the Supabase response structure
      const typedData = (data || []).map((msg: any) => ({
        ...msg,
        sender_profile: msg.sender_profile && typeof msg.sender_profile === 'object' && !msg.sender_profile.error 
          ? msg.sender_profile 
          : null
      })) as Message[];

      setMessages(typedData);

      // Mark received messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(msg => 
          msg.recipient_id === user?.id && !msg.read_at
        );

        if (unreadMessages.length > 0) {
          await supabase
            .from('creator_messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);

      const { data, error } = await supabase
        .from('creator_messages')
        .insert({
          sender_id: user.id,
          recipient_id: creatorId,
          message_text: newMessage.trim(),
          message_type: 'text'
        })
        .select(`
          *,
          sender_profile:profiles!creator_messages_sender_id_fkey(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Type assertion for the new message
      const typedMessage = {
        ...data,
        sender_profile: data.sender_profile && typeof data.sender_profile === 'object' && !(data.sender_profile as any).error 
          ? data.sender_profile 
          : null
      } as Message;

      setMessages(prev => [...prev, typedMessage]);
      setNewMessage('');

      toast({
        title: "Message sent!",
        description: `Your message was sent to ${creatorName}`,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send",
        description: "Unable to send your message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign in to message creators</h3>
          <p className="text-muted-foreground">
            Connect with local guides and ask questions about their cultural experiences.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span>Message {creatorName}</span>
              <Badge variant="outline" className="text-xs">
                Cultural Guide
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              Ask questions about their locations and experiences
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground text-sm">
                Send your first message to {creatorName}!<br />
                Ask about local tips, cultural insights, or hidden gems.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isFromUser = message.sender_id === user.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} gap-2`}
                  >
                    {!isFromUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={creatorAvatar} />
                        <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[70%] ${isFromUser ? 'text-right' : 'text-left'}`}>
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          isFromUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message_text}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(message.created_at)}</span>
                        {isFromUser && message.read_at && (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    </div>

                    {isFromUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-6 pt-3 border-t">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Ask ${creatorName} about their cultural insights...`}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}