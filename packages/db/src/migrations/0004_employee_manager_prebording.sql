-- Migration 0004: Add manager_id to employees and pre_boarding status
-- Adds direct manager relationship and pre_boarding lifecycle status
-- needed for the ATS → onboarding handoff (ADR 016).

-- Add pre_boarding to the employee_status enum so accepted-offer employees
-- have a distinct status before their first day.
ALTER TYPE employee_status ADD VALUE IF NOT EXISTS 'pre_boarding' BEFORE 'active';

-- Add direct manager reference (self-referential, nullable — first hires have no manager).
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS employees_manager_id_idx ON employees (manager_id);
