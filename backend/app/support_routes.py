# app/support_routes.py - Customer support ticket endpoints
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from bson import ObjectId

from .models import APIResponse, SupportTicket, SupportTicketReply, SupportStatus
from .auth import get_current_admin
from .database import get_support_collection

logger = logging.getLogger(__name__)
router = APIRouter()


# ========================
# CUSTOMER SUPPORT SYSTEM
# ========================

@router.post("/support/ticket", response_model=APIResponse)
async def submit_support_ticket(ticket: SupportTicket):
    """Public endpoint to submit a support ticket"""
    try:
        support_collection = await get_support_collection()
        ticket_data = ticket.dict()
        ticket_data["created_at"] = datetime.utcnow()
        ticket_data["status"] = SupportStatus.PENDING
        
        result = await support_collection.insert_one(ticket_data)
        
        logger.info(f"🎫 New support ticket created: {ticket.ticket_ref}")
        return APIResponse(
            success=True, 
            message="Ticket submitted successfully", 
            data={"ticket_ref": ticket.ticket_ref}
        )
    except Exception as e:
        logger.error(f"Support ticket submission error: {str(e)}")
        return APIResponse(success=False, message="Failed to submit ticket")

@router.get("/admin/support/tickets", response_model=APIResponse)
async def get_admin_support_tickets(
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """Admin endpoint to list all support tickets"""
    try:
        support_collection = await get_support_collection()
        query = {}
        if status_filter:
            query["status"] = status_filter
            
        tickets_cursor = support_collection.find(query) \
                      .sort("created_at", -1) \
                      .skip((page - 1) * limit) \
                      .limit(limit)
        
        tickets = []
        async for t in tickets_cursor:
            tickets.append(t)
        
        for t in tickets:
            t["id"] = str(t["_id"])
            del t["_id"]
            
        total = await support_collection.count_documents(query)
        
        return APIResponse(
            success=True, 
            message="Tickets fetched successfully", 
            data={"tickets": tickets, "total": total}
        )
    except Exception as e:
        logger.error(f"Error fetching support tickets: {str(e)}")
        return APIResponse(success=False, message="Failed to fetch tickets")

@router.patch("/admin/support/tickets/{ticket_id}/read", response_model=APIResponse)
async def mark_ticket_as_read(ticket_id: str, admin: dict = Depends(get_current_admin)):
    """Admin endpoint to mark a ticket as read"""
    try:
        support_collection = await get_support_collection()
        result = await support_collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": {"status": SupportStatus.READ}}
        )
        
        if result.modified_count == 0:
            return APIResponse(success=False, message="Ticket not found or already read")
            
        return APIResponse(success=True, message="Ticket marked as read")
    except Exception as e:
        logger.error(f"Error updating ticket status: {str(e)}")
        return APIResponse(success=False, message="Failed to update ticket")

@router.post("/admin/support/tickets/{ticket_id}/reply", response_model=APIResponse)
async def reply_to_ticket(ticket_id: str, reply: SupportTicketReply, admin: dict = Depends(get_current_admin)):
    """Admin endpoint to reply to a support ticket"""
    try:
        support_collection = await get_support_collection()
        reply_data = reply.dict()
        reply_data["timestamp"] = datetime.utcnow()
        
        result = await support_collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {
                "$push": {"replies": reply_data},
                "$set": {"status": SupportStatus.REPLIED}
            }
        )
        
        if result.modified_count == 0:
            return APIResponse(success=False, message="Ticket not found")
            
        logger.info(f"✉️ Admin replied to ticket: {ticket_id}")
        return APIResponse(success=True, message="Reply sent successfully")
    except Exception as e:
        logger.error(f"Error replying to ticket: {str(e)}")
        return APIResponse(success=False, message="Failed to send reply")

@router.delete("/admin/support/tickets/{ticket_id}", response_model=APIResponse)
async def delete_support_ticket(ticket_id: str, admin: dict = Depends(get_current_admin)):
    """Admin endpoint to delete a support ticket"""
    try:
        support_collection = await get_support_collection()
        result = await support_collection.delete_one({"_id": ObjectId(ticket_id)})
        
        if result.deleted_count == 0:
            return APIResponse(success=False, message="Ticket not found")
            
        return APIResponse(success=True, message="Ticket deleted successfully")
    except Exception as e:
        logger.error(f"Error deleting ticket: {str(e)}")
        return APIResponse(success=False, message="Failed to delete ticket")
