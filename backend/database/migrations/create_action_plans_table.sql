-- Migration: Create action_plans table
-- This table will store action plans for non-conforming answers in evaluations

CREATE TABLE IF NOT EXISTS action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    action_description TEXT NOT NULL,
    target_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_action_plans_answer_id ON action_plans(answer_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON action_plans(status);
CREATE INDEX IF NOT EXISTS idx_action_plans_responsible_user_id ON action_plans(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_target_date ON action_plans(target_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_action_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER action_plans_updated_at_trigger
    BEFORE UPDATE ON action_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_action_plans_updated_at();