const bcrypt = require('bcrypt');

const generateHashes = async () => {
  const passwords = [
    { email: 'admin@sistema.com', password: 'admin123' },
    { email: 'joao.silva@empresa.com', password: 'senha123' },
    { email: 'maria.santos@empresa.com', password: 'senha123' },
    { email: 'pedro.oliveira@empresa.com', password: 'senha123' }
  ];

  console.log('-- Hashes gerados com bcrypt:\n');
  
  for (const user of passwords) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`-- ${user.email} (senha: ${user.password})`);
    console.log(`'${hash}',\n`);
  }
};

generateHashes();