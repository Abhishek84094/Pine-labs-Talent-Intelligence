"""Database repository operations"""
import json
from datetime import datetime, timezone
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Submission, ProcessingStatus


def utcnow():
    return datetime.now(timezone.utc)


class SubmissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Submission:
        sub = Submission(**data)
        self.db.add(sub)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def get_by_id(self, submission_id: str) -> Submission | None:
        result = await self.db.execute(
            select(Submission).where(Submission.id == submission_id)
        )
        return result.scalar_one_or_none()

    async def get_by_reference_id(self, reference_id: str) -> Submission | None:
        result = await self.db.execute(
            select(Submission).where(Submission.reference_id == reference_id)
        )
        return result.scalar_one_or_none()

    async def update_status(
        self,
        submission_id: str,
        status: str,
        error_message: str | None = None,
        **extra_fields,
    ) -> Submission | None:
        sub = await self.get_by_id(submission_id)
        if not sub:
            return None
        sub.status = status
        sub.updated_at = utcnow()
        if error_message is not None:
            sub.error_message = error_message
        for key, value in extra_fields.items():
            setattr(sub, key, value)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def save_resume_analysis(self, submission_id: str, analysis: dict) -> None:
        sub = await self.get_by_id(submission_id)
        if sub:
            sub.resume_analysis = json.dumps(analysis)
            sub.updated_at = utcnow()
            await self.db.flush()

    async def save_project_analysis(self, submission_id: str, analysis: dict) -> None:
        sub = await self.get_by_id(submission_id)
        if sub:
            sub.project_analysis = json.dumps(analysis)
            sub.updated_at = utcnow()
            await self.db.flush()

    async def save_evaluation_report(self, submission_id: str, report: dict) -> None:
        sub = await self.get_by_id(submission_id)
        if sub:
            sub.evaluation_report = json.dumps(report)
            sub.updated_at = utcnow()
            await self.db.flush()

    async def list_submissions(
        self,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
        role_filter: str | None = None,
        status_filter: str | None = None,
        review_filter: str | None = None,
    ) -> tuple[list[Submission], int]:
        query = select(Submission)

        if search:
            query = query.where(
                or_(
                    Submission.full_name.ilike(f"%{search}%"),
                    Submission.reference_id.ilike(f"%{search}%"),
                    Submission.email.ilike(f"%{search}%"),
                )
            )
        if role_filter:
            query = query.where(Submission.job_role.ilike(f"%{role_filter}%"))
        if status_filter:
            query = query.where(Submission.status == status_filter)
        if review_filter:
            query = query.where(Submission.review_status == review_filter)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(Submission.submitted_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        submissions = list(result.scalars().all())

        return submissions, total

    async def update_review(
        self,
        submission_id: str,
        review_status: str,
        review_checklist: dict | None = None,
        reviewed_by: str | None = "Hiring Team",
    ) -> Submission | None:
        sub = await self.get_by_id(submission_id)
        if not sub:
            return None
        sub.review_status = review_status
        sub.reviewed_at = utcnow()
        if reviewed_by:
            sub.reviewed_by = reviewed_by
        if review_checklist is not None:
            sub.review_checklist = json.dumps(review_checklist)
        sub.updated_at = utcnow()
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def record_invitation_sent(
        self,
        submission_id: str,
        interview_details: dict,
    ) -> Submission | None:
        sub = await self.get_by_id(submission_id)
        if not sub:
            return None
        sub.review_status = "shortlisted"
        sub.email_sent = True
        sub.email_sent_at = utcnow()
        sub.interview_details = json.dumps(interview_details)
        sub.updated_at = utcnow()
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def get_stats(self) -> dict:
        total = await self.db.execute(select(func.count(Submission.id)))
        pending = await self.db.execute(
            select(func.count(Submission.id)).where(
                Submission.status.in_(
                    [
                        ProcessingStatus.UPLOADED,
                        ProcessingStatus.VALIDATING,
                        ProcessingStatus.QUEUED,
                        ProcessingStatus.ANALYZING_RESUME,
                        ProcessingStatus.ANALYZING_PROJECT,
                        ProcessingStatus.SYNTHESIZING_REPORT,
                    ]
                )
            )
        )
        completed = await self.db.execute(
            select(func.count(Submission.id)).where(
                Submission.status == ProcessingStatus.COMPLETED
            )
        )
        failed = await self.db.execute(
            select(func.count(Submission.id)).where(
                Submission.status.in_(
                    [ProcessingStatus.FAILED, ProcessingStatus.PARTIAL]
                )
            )
        )
        reviewed = await self.db.execute(
            select(func.count(Submission.id)).where(
                Submission.review_status.in_(["reviewed", "shortlisted"])
            )
        )
        shortlisted = await self.db.execute(
            select(func.count(Submission.id)).where(
                Submission.review_status == "shortlisted"
            )
        )
        return {
            "total": total.scalar() or 0,
            "pending": pending.scalar() or 0,
            "completed": completed.scalar() or 0,
            "failed": failed.scalar() or 0,
            "reviewed": reviewed.scalar() or 0,
            "shortlisted": shortlisted.scalar() or 0,
        }
