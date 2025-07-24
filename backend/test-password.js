const bcrypt = require('bcrypt');

// Teste do hash da senha admin123
const testPassword = async () => {
  const password = 'admin123';
  const storedHash = '$2a$10$8QZxY3WPMktR3hN6kGOFO.qY93eZ6pgb0CHaYJ0raN3vUlpC2mBZu';
  
  console.log('Testando senha:', password);
  console.log('Hash armazenado:', storedHash);
  
  try {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Senha válida?', isValid);
    
    // Gerar novo hash para comparação
    const newHash = await bcrypt.hash(password, 10);
    console.log('\nNovo hash gerado:', newHash);
    
    // Testar o novo hash
    const testNewHash = await bcrypt.compare(password, newHash);
    console.log('Novo hash válido?', testNewHash);
  } catch (error) {
    console.error('Erro:', error);
  }
};

testPassword();