from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from werkzeug.security import check_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── AUTH ─────────────────────────────────────────────────────────────────────

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        password = data.get("password")

        if not password:
            return jsonify({"error": "A palavra-passe é obrigatória"}), 400

        # Procura o utilizador de sistema (username fixo 'admin')
        res = supabase.table("users").select("*").eq("username", "admin").execute()
        user = res.data[0] if res.data else None

        if not user or not check_password_hash(user["password_hash"], password):
            print("Login falhou: Password incorreta")
            return jsonify({"error": "Palavra-passe incorreta"}), 401

        # Login sucesso
        print(f"Login efetuado com sucesso: {user['username']}")
        return jsonify({
            "id": user["id"],
            "username": user["username"],
            "name": user["name"]
        }), 200
    except Exception as e:
        print(f"ERRO NO LOGIN: {str(e)}")
        # Se o erro indicar que a tabela não existe, daremos uma pista clara
        error_msg = str(e)
        if "relation \"users\" does not exist" in error_msg:
            error_msg = "A tabela 'users' não existe na base de dados. Por favor, execute o script SQL atualizado no Supabase."
        return jsonify({"error": error_msg}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def to_snake(data: dict) -> dict:
    """Converte campos camelCase do frontend para snake_case da BD."""
    mapping = {
        "plannedStartDate": "planned_start_date",
        "plannedEndDate":   "planned_end_date",
        "plannedHours":     "planned_hours",
        "actualStartDate":  "actual_start_date",
        "actualEndDate":    "actual_end_date",
        "actualHours":      "actual_hours",
        "projectId":        "project_id",
        "phaseId":          "phase_id",
        "company":          "company",
    }
    result = {}
    for k, v in data.items():
        snake_key = mapping.get(k, k)
        result[snake_key] = v
    return result

# ─── PROJECTS ─────────────────────────────────────────────────────────────────

@app.route('/api/projects', methods=['GET'])
def get_projects():
    # Busca todos os projetos
    res = supabase.table("projects").select("*").execute()
    projects = res.data

    # Para cada projeto, busca as suas fases
    for p in projects:
        phases_res = supabase.table("phases").select("*").eq("project_id", p["id"]).order("planned_start_date").execute()
        p["phases"] = phases_res.data

    return jsonify(projects)

@app.route('/api/projects', methods=['POST'])
def create_project():
    try:
        data = request.json
        payload = to_snake({
            "name":             data.get("name"),
            "description":      data.get("description"),
            "owner":            data.get("owner"),
            "status":           data.get("status", "Novo"),
            "plannedStartDate": data.get("plannedStartDate"),
            "plannedEndDate":   data.get("plannedEndDate"),
            "plannedHours":     data.get("plannedHours", 0),
            "company":          data.get("company", "SAVOY"),
        })

        res = supabase.table("projects").insert(payload).execute()
        new_project = res.data[0] if res.data else {}
        new_project["phases"] = []
        return jsonify(new_project), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/projects/<id>', methods=['GET'])
def get_project(id):
    res = supabase.table("projects").select("*").eq("id", id).single().execute()
    project = res.data
    if not project:
        return jsonify({"error": "Project not found"}), 404

    phases_res = supabase.table("phases").select("*").eq("project_id", id).order("planned_start_date").execute()
    project["phases"] = phases_res.data
    return jsonify(project)

@app.route('/api/projects/<id>', methods=['PUT'])
def update_project(id):
    try:
        data = request.json
        payload = to_snake(data)
        # Remove campos que não devem ser actualizados directamente
        payload.pop("id", None)
        payload.pop("phases", None)

        res = supabase.table("projects").update(payload).eq("id", id).execute()
        if res.data:
            return jsonify(res.data[0])
        return jsonify({"error": "Project not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/projects/<id>', methods=['DELETE'])
def delete_project(id):
    # As fases e tarefas são eliminadas em cascata via ON DELETE CASCADE
    supabase.table("projects").delete().eq("id", id).execute()
    return '', 204

# ─── PHASES ───────────────────────────────────────────────────────────────────

@app.route('/api/projects/<project_id>/phases', methods=['POST'])
def create_phase(project_id):
    try:
        data = request.json
        payload = to_snake({
            "project_id":       project_id,
            "type":             data.get("type"),
            "name":             data.get("name"),
            "technician":       data.get("technician"),
            "plannedStartDate": data.get("plannedStartDate"),
            "plannedEndDate":   data.get("plannedEndDate"),
            "plannedHours":     data.get("plannedHours", 0),
        })

        res = supabase.table("phases").insert(payload).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/phases/<id>', methods=['PUT'])
def update_phase(id):
    try:
        data = request.json
        payload = to_snake(data)
        payload.pop("id", None)

        res = supabase.table("phases").update(payload).eq("id", id).execute()
        if res.data:
            return jsonify(res.data[0])
        return jsonify({"error": "Phase not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/phases/<id>', methods=['DELETE'])
def delete_phase(id):
    supabase.table("phases").delete().eq("id", id).execute()
    return '', 204

# ─── TASKS ────────────────────────────────────────────────────────────────────

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    # Busca todas as tarefas com join ao nome do projecto
    res = supabase.table("tasks").select("*, projects(name)").execute()
    tasks = res.data

    # Normaliza: adiciona project_name ao nível raiz
    for t in tasks:
        t["project_name"] = (t.pop("projects", None) or {}).get("name", "")

    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    try:
        data = request.json
        payload = to_snake({
            "projectId":        data.get("projectId"),
            "name":             data.get("name"),
            "ticket":           data.get("ticket"),
            "technician":       data.get("technician"),
            "requester":        data.get("requester"),
            "plannedStartDate": data.get("plannedStartDate"),
            "plannedEndDate":   data.get("plannedEndDate"),
            "plannedHours":     data.get("plannedHours", 0),
            "actualStartDate":  data.get("actualStartDate"),
            "actualEndDate":    data.get("actualEndDate"),
            "actualHours":      data.get("actualHours"),
            "status":           data.get("status", "Pendente"),
            "phaseId":          data.get("phaseId"),
        })

        res = supabase.table("tasks").insert(payload).execute()
        new_task = res.data[0] if res.data else {}
        new_task["project_name"] = ""  # será preenchido pelo store

        # Busca o nome do projecto para devolver
        if new_task.get("project_id"):
            proj_res = supabase.table("projects").select("name").eq("id", new_task["project_id"]).single().execute()
            if proj_res.data:
                new_task["project_name"] = proj_res.data["name"]

        return jsonify(new_task), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/tasks/<id>', methods=['PUT'])
def update_task(id):
    try:
        data = request.json
        payload = to_snake(data)
        payload.pop("id", None)
        res = supabase.table("tasks").update(payload).eq("id", id).execute()
        if res.data:
            return jsonify(res.data[0])
        return jsonify({"error": "Task not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/tasks/<id>', methods=['DELETE'])
def delete_task(id):
    supabase.table("tasks").delete().eq("id", id).execute()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5000)
