import { LoginCard } from '../../components/login/login-card';

export const metadata = { title: 'Sign In — PeopleOS' };

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #fce8f3 0%, #f0e8f8 45%, #e8edf8 100%)',
      padding: '24px',
    }}>
      <LoginCard />
    </div>
  );
}
