from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM tasks WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            tasks = cursor.fetchall()
        return jsonify(tasks), 200
    finally:
        conn.close()


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id)
            )
            task = cursor.fetchone()
        if not task:
            return jsonify({"error": "Task not found."}), 404
        return jsonify(task), 200
    finally:
        conn.close()


@tasks_bp.route("", methods=["POST"])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"error": "title is required."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO tasks
                   (user_id, project_id, title, description, status, priority, due_date)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    user_id,
                    data.get("project_id"),
                    title,
                    data.get("description", ""),
                    data.get("status", "Pending"),
                    data.get("priority", "Medium"),
                    data.get("due_date"),
                ),
            )
            new_id = cursor.lastrowid
        return jsonify({"message": "Task created.", "id": new_id}), 201
    finally:
        conn.close()


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id)
            )
            if not cursor.fetchone():
                return jsonify({"error": "Task not found."}), 404

            cursor.execute(
                """UPDATE tasks
                   SET title = %s, description = %s, status = %s, priority = %s, due_date = %s
                   WHERE id = %s AND user_id = %s""",
                (
                    data.get("title"),
                    data.get("description"),
                    data.get("status"),
                    data.get("priority"),
                    data.get("due_date"),
                    task_id,
                    user_id,
                ),
            )
        return jsonify({"message": "Task updated."}), 200
    finally:
        conn.close()


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id)
            )
        return jsonify({"message": "Task deleted."}), 200
    finally:
        conn.close()
