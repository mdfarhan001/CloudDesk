from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection

notes_bp = Blueprint("notes", __name__)


@notes_bp.route("", methods=["GET"])
@jwt_required()
def get_notes():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM notes WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            notes = cursor.fetchall()
        return jsonify(notes), 200
    finally:
        conn.close()


@notes_bp.route("/<int:note_id>", methods=["GET"])
@jwt_required()
def get_note(note_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM notes WHERE id = %s AND user_id = %s", (note_id, user_id)
            )
            note = cursor.fetchone()
        if not note:
            return jsonify({"error": "Note not found."}), 404
        return jsonify(note), 200
    finally:
        conn.close()


@notes_bp.route("", methods=["POST"])
@jwt_required()
def create_note():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"error": "title is required."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO notes (user_id, title, content) VALUES (%s, %s, %s)",
                (user_id, title, data.get("content", "")),
            )
            new_id = cursor.lastrowid
        return jsonify({"message": "Note created.", "id": new_id}), 201
    finally:
        conn.close()


@notes_bp.route("/<int:note_id>", methods=["PUT"])
@jwt_required()
def update_note(note_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM notes WHERE id = %s AND user_id = %s", (note_id, user_id)
            )
            if not cursor.fetchone():
                return jsonify({"error": "Note not found."}), 404

            cursor.execute(
                "UPDATE notes SET title = %s, content = %s WHERE id = %s AND user_id = %s",
                (data.get("title"), data.get("content"), note_id, user_id),
            )
        return jsonify({"message": "Note updated."}), 200
    finally:
        conn.close()


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@jwt_required()
def delete_note(note_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM notes WHERE id = %s AND user_id = %s", (note_id, user_id)
            )
        return jsonify({"message": "Note deleted."}), 200
    finally:
        conn.close()
