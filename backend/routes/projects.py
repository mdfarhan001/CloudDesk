from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("", methods=["GET"])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM projects WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            projects = cursor.fetchall()
        return jsonify(projects), 200
    finally:
        conn.close()


@projects_bp.route("/<int:project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM projects WHERE id = %s AND user_id = %s",
                (project_id, user_id),
            )
            project = cursor.fetchone()
        if not project:
            return jsonify({"error": "Project not found."}), 404
        return jsonify(project), 200
    finally:
        conn.close()


@projects_bp.route("", methods=["POST"])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    name = (data.get("project_name") or "").strip()
    description = data.get("description", "")
    status = data.get("status", "Pending")
    progress = data.get("progress", 0)

    if not name:
        return jsonify({"error": "project_name is required."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO projects (user_id, project_name, description, status, progress)
                   VALUES (%s, %s, %s, %s, %s)""",
                (user_id, name, description, status, progress),
            )
            new_id = cursor.lastrowid
        return jsonify({"message": "Project created.", "id": new_id}), 201
    finally:
        conn.close()


@projects_bp.route("/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM projects WHERE id = %s AND user_id = %s",
                (project_id, user_id),
            )
            if not cursor.fetchone():
                return jsonify({"error": "Project not found."}), 404

            cursor.execute(
                """UPDATE projects
                   SET project_name = %s, description = %s, status = %s, progress = %s
                   WHERE id = %s AND user_id = %s""",
                (
                    data.get("project_name"),
                    data.get("description"),
                    data.get("status"),
                    data.get("progress"),
                    project_id,
                    user_id,
                ),
            )
        return jsonify({"message": "Project updated."}), 200
    finally:
        conn.close()


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM projects WHERE id = %s AND user_id = %s",
                (project_id, user_id),
            )
        return jsonify({"message": "Project deleted."}), 200
    finally:
        conn.close()
