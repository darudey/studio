
export default function HomePageTest({ message }: { message: string }) {
  return (
    <div style={{
      backgroundColor: '#22c55e',
      color: 'white',
      padding: '40px',
      textAlign: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      border: '5px solid white',
      margin: '20px'
    }}>
      {message}
    </div>
  );
}
