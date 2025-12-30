import ChatRoom from '@/components/chat/ChatRoom';

type ChatPageProps = {
  params: {
    sessionId: string;
  };
};

export default function ChatPage({ params }: ChatPageProps) {
  return <ChatRoom sessionId={params.sessionId} />;
}
