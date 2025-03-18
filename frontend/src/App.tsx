import { useState } from 'react';
import Welcome from './components/Welcome';
import Chat from './components/Chat';

function App() {
  const [username, setUsername] = useState<string>('');
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  const handleLogin = (nickname: string) => {
    setUsername(nickname);
  };

  const handleExit = () => {
    setUsername('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100">
      {!username ? (
        <Welcome onLogin={handleLogin} onlineUsers={onlineUsers} />
      ) : (
        <Chat 
          username={username} 
          onExit={handleExit}
          onlineUsers={onlineUsers}
          setOnlineUsers={setOnlineUsers}
        />
      )}
    </div>
  );
}

export default App;