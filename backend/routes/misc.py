from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

misc_bp = Blueprint("misc", __name__)


@misc_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
            )
            users = cursor.fetchall()
        return jsonify(users), 200
    finally:
        conn.close()


@misc_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS total FROM projects WHERE user_id = %s", (user_id,)
            )
            total_projects = cursor.fetchone()["total"]

            cursor.execute(
                "SELECT COUNT(*) AS total FROM tasks WHERE user_id = %s", (user_id,)
            )
            total_tasks = cursor.fetchone()["total"]

            cursor.execute(
                "SELECT COUNT(*) AS total FROM tasks WHERE user_id = %s AND status = 'Completed'",
                (user_id,),
            )
            completed_tasks = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) AS total FROM users")
            team_members = cursor.fetchone()["total"]

        return jsonify(
            {
                "total_projects": total_projects,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "team_members": team_members,
            }
        ), 200
    finally:
        conn.close()


@misc_bp.route("/activity", methods=["GET"])
@jwt_required()
def get_activity():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT team_activity.id, activity, team_activity.created_at, users.name
                   FROM team_activity
                   JOIN users ON users.id = team_activity.user_id
                   ORDER BY team_activity.created_at DESC
                   LIMIT 20"""
            )
            activity = cursor.fetchall()
        return jsonify(activity), 200
    finally:
        conn.close()
