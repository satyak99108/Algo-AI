"""
Seed script — Populates the database with realistic NovaTech Solutions sample data.

Usage:
    python seed.py

Requires the database to be running and migrations applied.
"""

import asyncio
import uuid
from datetime import datetime, date, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, engine, Base
from app.models.person import Person, EntityStatus
from app.models.project import Project
from app.models.decision import Decision
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.process import Process
from app.models.event import Event
from app.models.document import Document, DocType
from app.models.workflow import Workflow
from app.models.relationship import Relationship


async def seed_data():
    """Seed the database with NovaTech Solutions sample data."""

    # Create tables if they don't exist (for development convenience)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Check if data already exists
        from sqlalchemy import select, func
        count = await session.execute(select(func.count()).select_from(Person))
        if count.scalar_one() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding NovaTech Solutions data...")

        # --- PEOPLE ---
        priya = Person(
            id=uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567801"),
            name="Priya Sharma",
            role="Client Success Manager",
            department="Client Services",
            email="priya@novatech.com",
            status=EntityStatus.active,
        )
        rahul = Person(
            id=uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567802"),
            name="Rahul Verma",
            role="Engineering Lead",
            department="Engineering",
            email="rahul@novatech.com",
            status=EntityStatus.active,
        )
        ananya = Person(
            id=uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567803"),
            name="Ananya Patel",
            role="Product Manager",
            department="Product",
            email="ananya@novatech.com",
            status=EntityStatus.active,
        )
        vikram = Person(
            id=uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567804"),
            name="Vikram Singh",
            role="CTO",
            department="Executive",
            email="vikram@novatech.com",
            status=EntityStatus.active,
        )
        meera = Person(
            id=uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567805"),
            name="Meera Joshi",
            role="HR Manager",
            department="Human Resources",
            email="meera@novatech.com",
            status=EntityStatus.active,
        )
        arjun = Person(
            id=uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567806"),
            name="Arjun Nair",
            role="Sales Lead",
            department="Sales",
            email="arjun@novatech.com",
            status=EntityStatus.active,
        )

        people = [priya, rahul, ananya, vikram, meera, arjun]

        # --- PROJECTS ---
        acme_onboarding = Project(
            id=uuid.UUID("b1b2c3d4-e5f6-7890-abcd-ef1234567801"),
            name="Acme Corp Onboarding",
            description="Full onboarding of Acme Corp as a new client, including CRM setup, implementation, and welcome sequence.",
            status=EntityStatus.active,
            start_date=date(2026, 7, 15),
            end_date=date(2026, 9, 15),
        )
        platform_redesign = Project(
            id=uuid.UUID("b1b2c3d4-e5f6-7890-abcd-ef1234567802"),
            name="Platform Redesign",
            description="Complete redesign of the customer-facing platform using React and modern UI patterns.",
            status=EntityStatus.active,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 12, 31),
        )
        mobile_app = Project(
            id=uuid.UUID("b1b2c3d4-e5f6-7890-abcd-ef1234567803"),
            name="Mobile App Launch",
            description="Launch the company's first mobile application for iOS and Android.",
            status=EntityStatus.active,
            start_date=date(2026, 8, 1),
            end_date=date(2027, 2, 28),
        )
        data_migration = Project(
            id=uuid.UUID("b1b2c3d4-e5f6-7890-abcd-ef1234567804"),
            name="Data Migration",
            description="Migrate legacy database to PostgreSQL with zero downtime.",
            status=EntityStatus.active,
            start_date=date(2026, 5, 1),
            end_date=date(2026, 8, 31),
        )

        projects = [acme_onboarding, platform_redesign, mobile_app, data_migration]

        # --- DECISIONS ---
        react_migration = Decision(
            id=uuid.UUID("c1b2c3d4-e5f6-7890-abcd-ef1234567801"),
            title="Migrate frontend to React",
            description="Move the frontend from jQuery to React for better component reuse and developer experience.",
            rationale="React offers better component architecture, larger ecosystem, and easier hiring. Vue was considered but React had more team familiarity.",
            made_at=datetime(2026, 5, 15, tzinfo=timezone.utc),
            impact="high",
        )
        onboarding_sop = Decision(
            id=uuid.UUID("c1b2c3d4-e5f6-7890-abcd-ef1234567802"),
            title="Standardize onboarding SOP",
            description="Create a standard operating procedure for all client onboarding to ensure consistency.",
            rationale="Previous onboardings were ad-hoc, leading to inconsistent client experiences. A standardized process reduces errors and improves satisfaction.",
            made_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
            impact="high",
        )
        pricing_change = Decision(
            id=uuid.UUID("c1b2c3d4-e5f6-7890-abcd-ef1234567803"),
            title="Adopt usage-based pricing",
            description="Shift from flat-rate to usage-based pricing model.",
            rationale="Usage-based pricing better aligns value with cost and allows smaller clients to start easily.",
            made_at=datetime(2026, 4, 20, tzinfo=timezone.utc),
            impact="high",
        )
        hire_engineers = Decision(
            id=uuid.UUID("c1b2c3d4-e5f6-7890-abcd-ef1234567804"),
            title="Hire 3 senior engineers",
            description="Expand the engineering team with 3 senior hires to support the platform redesign and mobile app.",
            rationale="Current team is stretched thin across too many projects. Senior engineers will accelerate delivery and mentor juniors.",
            made_at=datetime(2026, 7, 1, tzinfo=timezone.utc),
            impact="medium",
        )
        switch_agile = Decision(
            id=uuid.UUID("c1b2c3d4-e5f6-7890-abcd-ef1234567805"),
            title="Switch to agile sprints",
            description="Move from waterfall to 2-week agile sprints across all engineering teams.",
            rationale="Waterfall led to late feedback and scope creep. Agile sprints enable faster iteration and stakeholder involvement.",
            made_at=datetime(2026, 3, 10, tzinfo=timezone.utc),
            impact="medium",
        )

        decisions = [react_migration, onboarding_sop, pricing_change, hire_engineers, switch_agile]

        # --- TASKS ---
        tasks_list = [
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567801"),
                title="Set up CRM record for Acme Corp",
                description="Create the Acme Corp client record in the CRM system with all contact information.",
                status=TaskStatus.completed,
                priority=TaskPriority.high,
                due_date=date(2026, 7, 20),
            ),
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567802"),
                title="Design new dashboard UI",
                description="Create mockups and design specs for the redesigned customer dashboard.",
                status=TaskStatus.in_progress,
                priority=TaskPriority.high,
                due_date=date(2026, 8, 15),
            ),
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567803"),
                title="Implement React component library",
                description="Build the shared component library using React and shadcn/ui.",
                status=TaskStatus.in_progress,
                priority=TaskPriority.critical,
                due_date=date(2026, 9, 1),
            ),
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567804"),
                title="Migrate user table to PostgreSQL",
                description="Move the users table from legacy MySQL to PostgreSQL with data validation.",
                status=TaskStatus.completed,
                priority=TaskPriority.critical,
                due_date=date(2026, 7, 31),
            ),
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567805"),
                title="Draft Acme welcome email",
                description="Prepare the welcome email template for Acme Corp onboarding.",
                status=TaskStatus.pending,
                priority=TaskPriority.medium,
                due_date=date(2026, 8, 5),
            ),
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567806"),
                title="Interview senior engineer candidates",
                description="Conduct technical interviews for 3 senior engineer positions.",
                status=TaskStatus.in_progress,
                priority=TaskPriority.high,
                due_date=date(2026, 8, 20),
            ),
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567807"),
                title="Set up mobile CI/CD pipeline",
                description="Configure GitHub Actions for mobile app builds on iOS and Android.",
                status=TaskStatus.pending,
                priority=TaskPriority.medium,
                due_date=date(2026, 8, 25),
            ),
            Task(
                id=uuid.UUID("d1b2c3d4-e5f6-7890-abcd-ef1234567808"),
                title="Update pricing page",
                description="Redesign the pricing page to reflect the new usage-based pricing model.",
                status=TaskStatus.pending,
                priority=TaskPriority.medium,
                due_date=date(2026, 8, 10),
            ),
        ]

        # --- PROCESSES ---
        processes_list = [
            Process(
                id=uuid.UUID("e1b2c3d4-e5f6-7890-abcd-ef1234567801"),
                name="Client Onboarding",
                description="Standard process for onboarding new clients from contract signing to go-live.",
                steps=[
                    {"order": 1, "name": "Create CRM Record", "description": "Set up client in CRM system"},
                    {"order": 2, "name": "Assign Account Manager", "description": "Assign a dedicated account manager"},
                    {"order": 3, "name": "Create Implementation Tasks", "description": "Break down onboarding into tasks"},
                    {"order": 4, "name": "Send Welcome Email", "description": "Send welcome and onboarding guide"},
                    {"order": 5, "name": "Schedule Kickoff Call", "description": "Set up initial kickoff meeting"},
                    {"order": 6, "name": "Go-Live Checklist", "description": "Final checks before client goes live"},
                ],
            ),
            Process(
                id=uuid.UUID("e1b2c3d4-e5f6-7890-abcd-ef1234567802"),
                name="Bug Resolution",
                description="Standard process for reporting, triaging, and resolving software bugs.",
                steps=[
                    {"order": 1, "name": "Bug Reported", "description": "Bug is reported via support or internal"},
                    {"order": 2, "name": "Triage", "description": "Assess severity and assign priority"},
                    {"order": 3, "name": "Assign Developer", "description": "Assign to appropriate developer"},
                    {"order": 4, "name": "Fix & Test", "description": "Develop fix and write tests"},
                    {"order": 5, "name": "Code Review", "description": "Peer review of the fix"},
                    {"order": 6, "name": "Deploy", "description": "Deploy fix to production"},
                ],
            ),
            Process(
                id=uuid.UUID("e1b2c3d4-e5f6-7890-abcd-ef1234567803"),
                name="Feature Request Pipeline",
                description="Process for evaluating and implementing feature requests from clients or internal teams.",
                steps=[
                    {"order": 1, "name": "Request Submitted", "description": "Feature request is logged"},
                    {"order": 2, "name": "Product Review", "description": "Product team evaluates feasibility and priority"},
                    {"order": 3, "name": "Roadmap Decision", "description": "Decide if and when to build"},
                    {"order": 4, "name": "Design & Spec", "description": "Create design and technical spec"},
                    {"order": 5, "name": "Implementation", "description": "Build the feature"},
                    {"order": 6, "name": "Release", "description": "Release to production"},
                ],
            ),
        ]

        # --- EVENTS ---
        events_list = [
            Event(
                id=uuid.UUID("f1b2c3d4-e5f6-7890-abcd-ef1234567801"),
                title="Acme Corp signed contract",
                description="Acme Corp signed a 12-month enterprise contract worth ₹50L/year.",
                event_type="client_signed",
                occurred_at=datetime(2026, 7, 14, tzinfo=timezone.utc),
            ),
            Event(
                id=uuid.UUID("f1b2c3d4-e5f6-7890-abcd-ef1234567802"),
                title="Production system outage",
                description="30-minute production outage due to database connection pool exhaustion.",
                event_type="incident",
                occurred_at=datetime(2026, 6, 20, tzinfo=timezone.utc),
            ),
            Event(
                id=uuid.UUID("f1b2c3d4-e5f6-7890-abcd-ef1234567803"),
                title="Q2 Quarterly Business Review",
                description="Company-wide quarterly review covering revenue, product updates, and team growth.",
                event_type="review",
                occurred_at=datetime(2026, 7, 5, tzinfo=timezone.utc),
            ),
            Event(
                id=uuid.UUID("f1b2c3d4-e5f6-7890-abcd-ef1234567804"),
                title="Platform v2.0 launched",
                description="First public release of the redesigned platform with new dashboard and reports.",
                event_type="launch",
                occurred_at=datetime(2026, 8, 1, tzinfo=timezone.utc),
            ),
        ]

        # --- DOCUMENTS ---
        documents_list = [
            Document(
                id=uuid.UUID("01b2c3d4-e5f6-7890-abcd-ef1234567801"),
                title="Client Onboarding SOP v2.1",
                content="Standard Operating Procedure for Client Onboarding...\n\n1. Receive signed contract\n2. Create CRM record within 24 hours\n3. Assign account manager (Priya for enterprise, Arjun for SMB)\n4. Create implementation checklist\n5. Send welcome email using template WE-001\n6. Schedule kickoff within 5 business days\n7. Complete go-live checklist\n8. Post-launch review at 30 days",
                doc_type=DocType.pdf,
                source="Internal Knowledge Base",
                file_path="/documents/onboarding-sop-v2.1.pdf",
            ),
            Document(
                id=uuid.UUID("01b2c3d4-e5f6-7890-abcd-ef1234567802"),
                title="Engineering Playbook",
                content="Engineering Team Playbook\n\nDevelopment Process:\n- 2-week sprints, starting Monday\n- Daily standups at 10:00 AM\n- Sprint planning every other Monday\n- Retrospectives every other Friday\n\nCode Standards:\n- All code must be reviewed before merge\n- Minimum 80% test coverage\n- Use TypeScript for frontend, Python for backend\n\nDeployment:\n- Staging deploys on Wednesday\n- Production deploys on Thursday\n- No deploys on Friday",
                doc_type=DocType.pdf,
                source="Engineering Wiki",
                file_path="/documents/engineering-playbook.pdf",
            ),
            Document(
                id=uuid.UUID("01b2c3d4-e5f6-7890-abcd-ef1234567803"),
                title="Pricing Policy 2026",
                content="NovaTech Pricing Policy\n\nEffective: April 2026\n\nModel: Usage-based pricing\n\nTiers:\n- Starter: Up to 1,000 API calls/month — Free\n- Growth: Up to 50,000 API calls/month — ₹5,000/month\n- Enterprise: Unlimited — Custom pricing\n\nAll plans include:\n- 24/7 support\n- 99.9% SLA\n- Data export",
                doc_type=DocType.pdf,
                source="Finance Team",
                file_path="/documents/pricing-policy-2026.pdf",
            ),
        ]

        # --- WORKFLOWS ---
        workflows_list = [
            Workflow(
                id=uuid.UUID("11b2c3d4-e5f6-7890-abcd-ef1234567801"),
                name="Client Onboarding Workflow",
                description="Automated workflow triggered when a new client contract is signed.",
                trigger="New client contract signed",
                steps=[
                    {"order": 1, "action": "create_crm_record", "label": "Create CRM Record"},
                    {"order": 2, "action": "assign_account_manager", "label": "Assign Account Manager"},
                    {"order": 3, "action": "create_implementation_tasks", "label": "Create Implementation Tasks"},
                    {"order": 4, "action": "send_welcome_email", "label": "Send Welcome Email"},
                    {"order": 5, "action": "schedule_kickoff", "label": "Schedule Kickoff Call"},
                ],
            ),
            Workflow(
                id=uuid.UUID("11b2c3d4-e5f6-7890-abcd-ef1234567802"),
                name="Bug Fix Workflow",
                description="Workflow for handling and resolving production bugs.",
                trigger="Bug reported in production",
                steps=[
                    {"order": 1, "action": "create_incident_ticket", "label": "Create Incident Ticket"},
                    {"order": 2, "action": "assign_on_call_engineer", "label": "Assign On-Call Engineer"},
                    {"order": 3, "action": "investigate_and_fix", "label": "Investigate & Fix"},
                    {"order": 4, "action": "deploy_hotfix", "label": "Deploy Hotfix"},
                    {"order": 5, "action": "post_mortem", "label": "Post-Mortem Review"},
                ],
            ),
            Workflow(
                id=uuid.UUID("11b2c3d4-e5f6-7890-abcd-ef1234567803"),
                name="Feature Ship Workflow",
                description="End-to-end workflow for shipping a new feature from spec to production.",
                trigger="Feature approved for development",
                steps=[
                    {"order": 1, "action": "create_design_spec", "label": "Create Design Spec"},
                    {"order": 2, "action": "create_sprint_tasks", "label": "Create Sprint Tasks"},
                    {"order": 3, "action": "implement", "label": "Implement"},
                    {"order": 4, "action": "code_review", "label": "Code Review"},
                    {"order": 5, "action": "qa_testing", "label": "QA Testing"},
                    {"order": 6, "action": "deploy_to_production", "label": "Deploy to Production"},
                    {"order": 7, "action": "announce_release", "label": "Announce Release"},
                ],
            ),
        ]

        # Add all entities
        for entity_list in [people, projects, decisions, tasks_list, processes_list, events_list, documents_list, workflows_list]:
            for entity in entity_list:
                session.add(entity)

        await session.flush()

        # --- RELATIONSHIPS ---
        relationships_data = [
            # Person → owns → Project
            ("people", priya.id, "owns", "projects", acme_onboarding.id),
            ("people", rahul.id, "owns", "projects", platform_redesign.id),
            ("people", ananya.id, "owns", "projects", mobile_app.id),
            ("people", rahul.id, "owns", "projects", data_migration.id),
            # Person → made → Decision
            ("people", vikram.id, "made", "decisions", react_migration.id),
            ("people", priya.id, "made", "decisions", onboarding_sop.id),
            ("people", arjun.id, "made", "decisions", pricing_change.id),
            ("people", meera.id, "made", "decisions", hire_engineers.id),
            ("people", vikram.id, "made", "decisions", switch_agile.id),
            # Decision → affects → Project
            ("decisions", react_migration.id, "affects", "projects", platform_redesign.id),
            ("decisions", onboarding_sop.id, "affects", "projects", acme_onboarding.id),
            ("decisions", hire_engineers.id, "affects", "projects", mobile_app.id),
            ("decisions", switch_agile.id, "affects", "projects", platform_redesign.id),
            # Event → triggers → Workflow
            ("events", events_list[0].id, "triggers", "workflows", workflows_list[0].id),
            ("events", events_list[1].id, "triggers", "workflows", workflows_list[1].id),
            ("events", events_list[3].id, "triggers", "workflows", workflows_list[2].id),
            # Workflow → creates → Task
            ("workflows", workflows_list[0].id, "creates", "tasks", tasks_list[0].id),
            ("workflows", workflows_list[0].id, "creates", "tasks", tasks_list[4].id),
            ("workflows", workflows_list[2].id, "creates", "tasks", tasks_list[1].id),
            ("workflows", workflows_list[2].id, "creates", "tasks", tasks_list[2].id),
            # Task → assigned_to → Person
            ("tasks", tasks_list[0].id, "assigned_to", "people", priya.id),
            ("tasks", tasks_list[1].id, "assigned_to", "people", ananya.id),
            ("tasks", tasks_list[2].id, "assigned_to", "people", rahul.id),
            ("tasks", tasks_list[3].id, "assigned_to", "people", rahul.id),
            ("tasks", tasks_list[4].id, "assigned_to", "people", priya.id),
            ("tasks", tasks_list[5].id, "assigned_to", "people", meera.id),
            ("tasks", tasks_list[6].id, "assigned_to", "people", rahul.id),
            ("tasks", tasks_list[7].id, "assigned_to", "people", arjun.id),
        ]

        for source_type, source_id, rel_type, target_type, target_id in relationships_data:
            rel = Relationship(
                source_type=source_type,
                source_id=source_id,
                relationship_type=rel_type,
                target_type=target_type,
                target_id=target_id,
            )
            session.add(rel)

        await session.commit()
        print(f"Seeded: {len(people)} people, {len(projects)} projects, "
              f"{len(decisions)} decisions, {len(tasks_list)} tasks, "
              f"{len(processes_list)} processes, {len(events_list)} events, "
              f"{len(documents_list)} documents, {len(workflows_list)} workflows, "
              f"{len(relationships_data)} relationships")
        print("Done!")


if __name__ == "__main__":
    asyncio.run(seed_data())
