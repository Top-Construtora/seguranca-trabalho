const bcrypt = require('bcryptjs');

// Definir as senhas para cada usuário
const passwords = [
  { email: 'admin@sistema.com', password: 'admin123' },
  { email: 'joao.silva@empresa.com', password: 'senha123' },
  { email: 'maria.santos@empresa.com', password: 'senha123' },
  { email: 'pedro.oliveira@empresa.com', password: 'senha123' }
];

// Gerar hashes
console.log('-- Hashes bcrypt para as senhas:');
console.log('-- Copie e cole estes valores no arquivo seed.sql\n');

passwords.forEach(async (user) => {
  const hash = await bcrypt.hash(user.password, 10);
  console.log(`-- ${user.email} (senha: ${user.password})`);
  console.log(`-- Hash: ${hash}\n`);
});

// Aguardar um pouco para garantir que todos os hashes sejam gerados
setTimeout(() => {
  console.log('\n-- Exemplo de como atualizar o seed.sql:');
  console.log(`-- Substitua '$2a$10$YourHashHere' pelos hashes gerados acima`);
}, 1000);