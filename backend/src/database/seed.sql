-- Script para popular o banco de dados com dados de exemplo
-- Execute este script após criar a estrutura do banco (schema.sql)

-- Limpar dados existentes (na ordem correta para respeitar as foreign keys)
TRUNCATE TABLE logs CASCADE;
TRUNCATE TABLE answers CASCADE;
TRUNCATE TABLE evaluations CASCADE;
TRUNCATE TABLE questions CASCADE;
TRUNCATE TABLE works CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE penalty_table CASCADE;

-- Inserir usuários
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
-- Senha: admin123
('550e8400-e29b-41d4-a716-446655440001', 'Admin Sistema', 'admin@sistema.com', '$2b$10$ETdgZQBjduhTnqGuUwlCxedDDqREs3PU7YX3zqPrbBvJUcpVNQVoO', 'admin', true),
-- Senha: senha123
('550e8400-e29b-41d4-a716-446655440002', 'João Silva', 'joao.silva@empresa.com', '$2b$10$obUFnKr1bpwWJ3.vQnIAWuIWwb3O2hi/eSTaPZYEi9FmOHWdLEsnK', 'avaliador', true),
-- Senha: senha123
('550e8400-e29b-41d4-a716-446655440003', 'Maria Santos', 'maria.santos@empresa.com', '$2b$10$n0LNagQJaKAZbRdZbR4DrOPSlXvgBKvKFT.MKl4q8ubQkBd3/JS.i', 'avaliador', true),
-- Senha: senha123
('550e8400-e29b-41d4-a716-446655440004', 'Pedro Oliveira', 'pedro.oliveira@empresa.com', '$2b$10$ByG4rWKlCpQUpzd4XB3Oue97wC7mExlkKa7Z3b..KCR2e.Oj.a5DS', 'avaliador', false);

-- Inserir obras
INSERT INTO works (id, name, address, responsible, responsible_email, responsible_phone, number, is_active) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Obra Centro Comercial', 'Rua das Flores, 123 - Centro', 'Carlos Mendes', 'carlos.mendes@construcao.com', '(11) 98765-4321', 'OBR-001', true),
('650e8400-e29b-41d4-a716-446655440002', 'Residencial Parque Verde', 'Av. dos Jardins, 456 - Jardim Europa', 'Ana Paula Costa', 'ana.costa@construcao.com', '(11) 97654-3210', 'OBR-002', true),
('650e8400-e29b-41d4-a716-446655440003', 'Hospital Municipal', 'Rua da Saúde, 789 - Vila Nova', 'Roberto Alves', 'roberto.alves@construcao.com', '(11) 96543-2109', 'OBR-003', true),
('650e8400-e29b-41d4-a716-446655440004', 'Escola Estadual', 'Av. da Educação, 321 - Bairro Escolar', 'Luciana Ferreira', 'luciana.ferreira@construcao.com', '(11) 95432-1098', 'OBR-004', false);

-- Inserir perguntas para OBRA
INSERT INTO questions (id, text, weight, type, is_active, "order") VALUES
-- Peso 1 (Leve)
('750e8400-e29b-41d4-a716-446655440001', 'Os trabalhadores estão usando capacete de segurança?', 1, 'obra', true, 1),
('750e8400-e29b-41d4-a716-446655440002', 'Há sinalização de segurança visível na obra?', 1, 'obra', true, 2),
('750e8400-e29b-41d4-a716-446655440003', 'Os trabalhadores possuem crachá de identificação?', 1, 'obra', true, 3),
-- Peso 2 (Médio)
('750e8400-e29b-41d4-a716-446655440004', 'Os andaimes estão montados corretamente com guarda-corpo?', 2, 'obra', true, 4),
('750e8400-e29b-41d4-a716-446655440005', 'Existe proteção contra queda de materiais?', 2, 'obra', true, 5),
('750e8400-e29b-41d4-a716-446655440006', 'Os equipamentos elétricos estão aterrados?', 2, 'obra', true, 6),
-- Peso 3 (Grave)
('750e8400-e29b-41d4-a716-446655440007', 'Há extintores de incêndio disponíveis e sinalizados?', 3, 'obra', true, 7),
('750e8400-e29b-41d4-a716-446655440008', 'Os trabalhadores em altura usam cinto de segurança?', 3, 'obra', true, 8),
('750e8400-e29b-41d4-a716-446655440009', 'Existe PCMSO e PPRA atualizados?', 3, 'obra', true, 9),
-- Peso 4 (Gravíssimo)
('750e8400-e29b-41d4-a716-446655440010', 'A obra possui alvará e licenças necessárias?', 4, 'obra', true, 10),
('750e8400-e29b-41d4-a716-446655440011', 'Há risco iminente de desabamento ou acidente grave?', 4, 'obra', true, 11),
('750e8400-e29b-41d4-a716-446655440012', 'Os trabalhadores receberam treinamento de segurança?', 4, 'obra', true, 12);

-- Inserir perguntas para ALOJAMENTO
INSERT INTO questions (id, text, weight, type, is_active, "order") VALUES
-- Peso 1 (Leve)
('750e8400-e29b-41d4-a716-446655440013', 'Os quartos possuem ventilação adequada?', 1, 'alojamento', true, 1),
('750e8400-e29b-41d4-a716-446655440014', 'Há armários individuais para os trabalhadores?', 1, 'alojamento', true, 2),
('750e8400-e29b-41d4-a716-446655440015', 'A iluminação dos quartos é adequada?', 1, 'alojamento', true, 3),
-- Peso 2 (Médio)
('750e8400-e29b-41d4-a716-446655440016', 'Os banheiros estão limpos e em bom estado?', 2, 'alojamento', true, 4),
('750e8400-e29b-41d4-a716-446655440017', 'Existe água potável disponível?', 2, 'alojamento', true, 5),
('750e8400-e29b-41d4-a716-446655440018', 'As camas possuem colchões em bom estado?', 2, 'alojamento', true, 6),
-- Peso 3 (Grave)
('750e8400-e29b-41d4-a716-446655440019', 'O alojamento possui saídas de emergência sinalizadas?', 3, 'alojamento', true, 7),
('750e8400-e29b-41d4-a716-446655440020', 'Há separação adequada entre cozinha e dormitórios?', 3, 'alojamento', true, 8),
('750e8400-e29b-41d4-a716-446655440021', 'Existe sistema de combate a incêndio?', 3, 'alojamento', true, 9),
-- Peso 4 (Gravíssimo)
('750e8400-e29b-41d4-a716-446655440022', 'O alojamento possui condições mínimas de habitabilidade?', 4, 'alojamento', true, 10),
('750e8400-e29b-41d4-a716-446655440023', 'Há superlotação nos quartos?', 4, 'alojamento', true, 11),
('750e8400-e29b-41d4-a716-446655440024', 'As instalações elétricas são seguras?', 4, 'alojamento', true, 12);

-- Inserir tabela de multas
INSERT INTO penalty_table (id, employees_min, employees_max, weight, min_value, max_value) VALUES
-- Peso 1 - Infrações Leves
('850e8400-e29b-41d4-a716-446655440001', 1, 10, 1, 100.00, 500.00),
('850e8400-e29b-41d4-a716-446655440002', 11, 25, 1, 200.00, 750.00),
('850e8400-e29b-41d4-a716-446655440003', 26, 50, 1, 400.00, 1000.00),
('850e8400-e29b-41d4-a716-446655440004', 51, 100, 1, 600.00, 1500.00),
('850e8400-e29b-41d4-a716-446655440005', 101, 9999, 1, 1000.00, 2000.00),
-- Peso 2 - Infrações Médias
('850e8400-e29b-41d4-a716-446655440006', 1, 10, 2, 500.00, 1500.00),
('850e8400-e29b-41d4-a716-446655440007', 11, 25, 2, 750.00, 2000.00),
('850e8400-e29b-41d4-a716-446655440008', 26, 50, 2, 1000.00, 3000.00),
('850e8400-e29b-41d4-a716-446655440009', 51, 100, 2, 1500.00, 4000.00),
('850e8400-e29b-41d4-a716-446655440010', 101, 9999, 2, 2000.00, 5000.00),
-- Peso 3 - Infrações Graves
('850e8400-e29b-41d4-a716-446655440011', 1, 10, 3, 1500.00, 3000.00),
('850e8400-e29b-41d4-a716-446655440012', 11, 25, 3, 2000.00, 4000.00),
('850e8400-e29b-41d4-a716-446655440013', 26, 50, 3, 3000.00, 6000.00),
('850e8400-e29b-41d4-a716-446655440014', 51, 100, 3, 4000.00, 8000.00),
('850e8400-e29b-41d4-a716-446655440015', 101, 9999, 3, 5000.00, 10000.00),
-- Peso 4 - Infrações Gravíssimas
('850e8400-e29b-41d4-a716-446655440016', 1, 10, 4, 3000.00, 6000.00),
('850e8400-e29b-41d4-a716-446655440017', 11, 25, 4, 4000.00, 8000.00),
('850e8400-e29b-41d4-a716-446655440018', 26, 50, 4, 6000.00, 12000.00),
('850e8400-e29b-41d4-a716-446655440019', 51, 100, 4, 8000.00, 16000.00),
('850e8400-e29b-41d4-a716-446655440020', 101, 9999, 4, 10000.00, 20000.00);

-- Inserir avaliações de exemplo
INSERT INTO evaluations (id, work_id, user_id, type, date, employees_count, notes, status, total_penalty) VALUES
('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'obra', '2024-01-15', 45, 'Primeira vistoria da obra. Foram encontradas algumas irregularidades.', 'completed', 4500.00),
('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'alojamento', '2024-01-15', 45, 'Vistoria do alojamento dos trabalhadores.', 'completed', 2000.00),
('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'obra', '2024-01-20', 30, 'Obra em fase inicial, algumas melhorias necessárias.', 'completed', 1500.00),
('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'obra', '2024-01-25', 75, 'Vistoria em andamento.', 'draft', 0.00);

-- Inserir respostas para a primeira avaliação (obra)
INSERT INTO answers (id, evaluation_id, question_id, answer, observation, evidence_urls) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'sim', 'Todos usando capacete adequadamente', '{}'),
('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'nao', 'Falta sinalização em algumas áreas', '{"https://exemplo.com/foto1.jpg"}'),
('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440004', 'nao', 'Andaimes sem guarda-corpo em alguns pontos', '{"https://exemplo.com/foto2.jpg", "https://exemplo.com/foto3.jpg"}'),
('a50e8400-e29b-41d4-a716-446655440004', '950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440007', 'sim', 'Extintores presentes e sinalizados', '{}'),
('a50e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440010', 'sim', 'Documentação em ordem', '{}');

-- Inserir respostas para a segunda avaliação (alojamento)
INSERT INTO answers (id, evaluation_id, question_id, answer, observation, evidence_urls) VALUES
('a50e8400-e29b-41d4-a716-446655440006', '950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440013', 'sim', 'Ventilação adequada com janelas', '{}'),
('a50e8400-e29b-41d4-a716-446655440007', '950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440014', 'nao', 'Faltam armários para alguns trabalhadores', '{}'),
('a50e8400-e29b-41d4-a716-446655440008', '950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440016', 'sim', 'Banheiros limpos e funcionando', '{}'),
('a50e8400-e29b-41d4-a716-446655440009', '950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440019', 'nao', 'Saídas de emergência mal sinalizadas', '{"https://exemplo.com/foto4.jpg"}'),
('a50e8400-e29b-41d4-a716-446655440010', '950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440022', 'sim', 'Condições adequadas de habitação', '{}');

-- Inserir logs de exemplo
INSERT INTO logs (id, user_id, action, entity, entity_id, details, ip_address, user_agent) VALUES
('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'login', 'user', '550e8400-e29b-41d4-a716-446655440002', '{"timestamp": "2024-01-15T08:00:00Z"}', '192.168.1.100', 'Mozilla/5.0'),
('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'create', 'evaluation', '950e8400-e29b-41d4-a716-446655440001', '{"work": "Obra Centro Comercial", "type": "obra"}', '192.168.1.100', 'Mozilla/5.0'),
('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'update', 'evaluation', '950e8400-e29b-41d4-a716-446655440001', '{"status": "completed"}', '192.168.1.100', 'Mozilla/5.0'),
('b50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'create', 'work', '650e8400-e29b-41d4-a716-446655440001', '{"name": "Obra Centro Comercial"}', '192.168.1.101', 'Mozilla/5.0'),
('b50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'export', 'evaluation', '950e8400-e29b-41d4-a716-446655440001', '{"format": "pdf"}', '192.168.1.101', 'Mozilla/5.0');

-- Senhas dos usuários:
-- admin@sistema.com: admin123
-- joao.silva@empresa.com: senha123
-- maria.santos@empresa.com: senha123
-- pedro.oliveira@empresa.com: senha123

-- Para executar este script:
-- psql -U seu_usuario -d seu_banco -f seed.sql