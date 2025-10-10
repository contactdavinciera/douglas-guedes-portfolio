from flask import Blueprint, request, jsonify
from src.models.project import Project, db
from src.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

colorist_bp = Blueprint("colorist", __name__)

@colorist_bp.route("/dashboard", methods=["GET"])
def get_colorist_dashboard():
    """
    Retorna dados do dashboard do colorista
    """
    try:
        # Por enquanto, retornar todos os projetos
        # Em produção, filtrar por colorista_id
        
        # Projetos pendentes (aguardando colorista)
        pending_projects = Project.query.filter(
            Project.status.in_(["analyzed", "approved"])
        ).order_by(Project.created_at.desc()).limit(10).all()
        
        # Projetos em andamento
        in_progress_projects = Project.query.filter(
            Project.status.in_(["in_progress", "grading"])
        ).order_by(Project.updated_at.desc()).all()
        
        # Projetos completados (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        completed_projects = Project.query.filter(
            and_(
                Project.status == "completed",
                Project.completed_at >= thirty_days_ago
            )
        ).order_by(Project.completed_at.desc()).all()
        
        # Estatísticas
        total_pending = len(pending_projects)
        total_in_progress = len(in_progress_projects)
        total_completed_month = len(completed_projects)
        
        # Receita do mês
        monthly_revenue = sum(p.final_price or p.estimated_price for p in completed_projects)
        
        return jsonify({
            "pending_projects": [p.to_dict() for p in pending_projects],
            "in_progress_projects": [p.to_dict() for p in in_progress_projects],
            "completed_projects": [p.to_dict() for p in completed_projects],
            "stats": {
                "total_pending": total_pending,
                "total_in_progress": total_in_progress,
                "total_completed_month": total_completed_month,
                "monthly_revenue": round(monthly_revenue, 2)
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@colorist_bp.route("/project/<int:project_id>/claim", methods=["POST"])
def claim_project(project_id):
    """
    Colorista reivindica um projeto
    """
    try:
        data = request.get_json()
        colorist_email = data.get("colorist_email")  # Em produção, vem do JWT
        
        if not colorist_email:
            return jsonify({"error": "colorist_email é obrigatório"}), 400
        
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Projeto não encontrado"}), 404
        
        if project.status not in ["analyzed", "approved"]:
            return jsonify({"error": "Projeto não está disponível para reivindicação"}), 400
        
        # Atualizar projeto
        project.status = "in_progress"
        project.updated_at = datetime.utcnow()
        
        # Adicionar colorista aos metadados
        metadata = project.get_metadata()
        metadata["colorist_email"] = colorist_email
        metadata["claimed_at"] = datetime.utcnow().isoformat()
        project.set_metadata(metadata)
        
        db.session.commit()
        
        return jsonify({
            "message": "Projeto reivindicado com sucesso",
            "project": project.to_dict()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@colorist_bp.route("/project/<int:project_id>/update-status", methods=["POST"])
def update_project_status(project_id):
    """
    Atualiza status do projeto
    """
    try:
        data = request.get_json()
        new_status = data.get("status")
        notes = data.get("notes", "")
        
        valid_statuses = ["in_progress", "grading", "review", "completed", "delivered"]
        if new_status not in valid_statuses:
            return jsonify({"error": f"Status inválido. Use: {valid_statuses}"}), 400
        
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Projeto não encontrado"}), 404
        
        # Atualizar projeto
        old_status = project.status
        project.status = new_status
        project.updated_at = datetime.utcnow()
        
        if notes:
            project.notes = notes
        
        # Se completado, definir data de conclusão
        if new_status == "completed":
            project.completed_at = datetime.utcnow()
        
        # Adicionar histórico aos metadados
        metadata = project.get_metadata()
        if "status_history" not in metadata:
            metadata["status_history"] = []
        
        metadata["status_history"].append({
            "from_status": old_status,
            "to_status": new_status,
            "timestamp": datetime.utcnow().isoformat(),
            "notes": notes
        })
        
        project.set_metadata(metadata)
        
        db.session.commit()
        
        return jsonify({
            "message": "Status atualizado com sucesso",
            "project": project.to_dict()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@colorist_bp.route("/project/<int:project_id>/upload-result", methods=["POST"])
def upload_graded_result(project_id):
    """
    Upload do resultado final do color grading
    """
    try:
        data = request.get_json()
        result_url = data.get("result_url")  # URL do arquivo processado
        final_notes = data.get("notes", "")
        
        if not result_url:
            return jsonify({"error": "result_url é obrigatório"}), 400
        
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Projeto não encontrado"}), 404
        
        # Atualizar projeto
        project.status = "completed"
        project.completed_at = datetime.utcnow()
        project.updated_at = datetime.utcnow()
        
        if final_notes:
            project.notes = final_notes
        
        # Adicionar URL do resultado aos metadados
        metadata = project.get_metadata()
        metadata["result_url"] = result_url
        metadata["completed_by"] = metadata.get("colorist_email", "unknown")
        metadata["completion_date"] = datetime.utcnow().isoformat()
        
        project.set_metadata(metadata)
        
        db.session.commit()
        
        return jsonify({
            "message": "Resultado enviado com sucesso",
            "project": project.to_dict()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@colorist_bp.route("/stats", methods=["GET"])
def get_colorist_stats():
    """
    Estatísticas detalhadas do colorista
    """
    try:
        # Filtros de data
        days = request.args.get("days", 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Projetos no período
        projects = Project.query.filter(
            Project.created_at >= start_date
        ).all()
        
        # Calcular estatísticas
        total_projects = len(projects)
        completed_projects = [p for p in projects if p.status == "completed"]
        total_completed = len(completed_projects)
        
        total_revenue = sum(p.final_price or p.estimated_price for p in completed_projects)
        avg_project_value = total_revenue / total_completed if total_completed > 0 else 0
        
        # Projetos por status
        status_breakdown = {}
        for project in projects:
            status = project.status
            status_breakdown[status] = status_breakdown.get(status, 0) + 1
        
        # Projetos por tipo
        type_breakdown = {}
        for project in projects:
            metadata = project.get_metadata()
            project_type = metadata.get("project_type", "SDR")
            type_breakdown[project_type] = type_breakdown.get(project_type, 0) + 1
        
        return jsonify({
            "period_days": days,
            "total_projects": total_projects,
            "total_completed": total_completed,
            "completion_rate": round((total_completed / total_projects * 100) if total_projects > 0 else 0, 1),
            "total_revenue": round(total_revenue, 2),
            "avg_project_value": round(avg_project_value, 2),
            "status_breakdown": status_breakdown,
            "type_breakdown": type_breakdown
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

