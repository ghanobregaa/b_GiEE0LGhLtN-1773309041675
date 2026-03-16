from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from werkzeug.security import check_password_hash, generate_password_hash
import pandas as pd
import io
from flask import send_file
from datetime import datetime, date, timedelta
import calendar
from fpdf import FPDF
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg') # Non-interactive backend

load_dotenv()

app = Flask(__name__)
# Permitir qualquer origem para facilitar o desenvolvimento
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
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Utilizador e palavra-passe são obrigatórios"}), 400

        # Procura o utilizador pelo username
        res = supabase.table("users").select("*").eq("username", username).execute()
        user = res.data[0] if res.data else None

        if not user or not check_password_hash(user["password_hash"], password):
            print(f"Login falhou para: {username}")
            return jsonify({"error": "Credenciais incorretas"}), 401

        # Login sucesso
        print(f"Login efetuado com sucesso: {user['username']}")
        return jsonify({
            "id": user["id"],
            "username": user["username"],
            "name": user["name"],
            "color": user.get("color", "#6366f1"),
            "role": user.get("role", "técnico")
        }), 200
    except Exception as e:
        print(f"ERRO NO LOGIN: {str(e)}")
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
        "startTime":        "start_time",
        "durationHours":    "duration_hours",
        "duration_hours":   "duration_hours",
        "technicianId":     "technician_id",
        "technician_id":    "technician_id",
        "technicianIds":    "technician_ids",
        "technician_ids":   "technician_ids",
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
        payload = to_snake(data)
        
        # Defaults
        if "status" not in payload: payload["status"] = "Novo"
        if "company" not in payload: payload["company"] = "SAVOY"
        if "planned_hours" not in payload: payload["planned_hours"] = 0
        
        # Ensure UUID and Date fields are not empty strings
        for field in ["owner", "planned_start_date", "planned_end_date", "actual_start_date", "actual_end_date"]:
            if field in payload and not payload[field]:
                payload[field] = None

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

        # Ensure Date fields are not empty strings
        for field in ["planned_start_date", "planned_end_date", "actual_start_date", "actual_end_date"]:
            if field in payload and not payload[field]:
                payload[field] = None

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

@app.route('/api/projects/export/excel', methods=['GET'])
def export_projects_excel():
    try:
        # Busca projetos e tarefas
        proj_res = supabase.table("projects").select("*").execute()
        task_res = supabase.table("tasks").select("*, projects(name)").execute()
        
        projects = proj_res.data
        tasks = task_res.data
        
        # Prepara dados para o Excel
        project_data = []
        for p in projects:
            p_tasks = [t for t in tasks if t["project_id"] == p["id"]]
            actual_hours = sum(t.get("actual_hours", 0) or 0 for t in p_tasks)
            
            project_data.append({
                "Projeto": p["name"],
                "Empresa": p["company"],
                "Estado": p["status"],
                "Responsável": p["owner"],
                "Início Previsto": p["planned_start_date"],
                "Fim Previsto": p["planned_end_date"],
                "Horas Previstas": p["planned_hours"],
                "Horas Reais": actual_hours,
                "Progresso": f"{round((actual_hours / p['planned_hours'] * 100)) if p['planned_hours'] > 0 else 0}%"
            })
            
        df = pd.DataFrame(project_data)
        
        # Cria o Excel em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Projetos')
            
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='projetos_afa.xlsx'
        )
    except Exception as e:
        print(f"Erro na exportação: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/monthly/export', methods=['GET'])
def export_monthly_report():
    try:
        # 1. Calcular datas do mês passado
        today = datetime.now()
        first_day_current = today.replace(day=1)
        last_day_prev = first_day_current - timedelta(days=1)
        first_day_prev = last_day_prev.replace(day=1)
        
        start_date = first_day_prev.strftime('%Y-%m-%d')
        end_date = last_day_prev.strftime('%Y-%m-%d')

        # 2. Buscar Dados
        meetings_res = supabase.table("meetings").select("*, projects(name)").gte("date", start_date).lte("date", end_date).execute()
        meetings = meetings_res.data or []
        
        tasks_res = supabase.table("tasks").select("*, projects(name)").execute()
        all_tasks = tasks_res.data or []
        
        projects_res = supabase.table("projects").select("*").execute()
        projects = projects_res.data or []
        
        phases_res = supabase.table("phases").select("*").execute()
        phases = phases_res.data or []

        users_res = supabase.table("users").select("*").execute()
        users_list = users_res.data or []

        # 3. Preparar Dados para Gráficos
        # 3.1 Horas por Técnico
        tech_hours = {}
        for t in all_tasks:
            t_start = t.get("actual_start_date") or t.get("planned_start_date")
            t_end = t.get("actual_end_date") or t.get("planned_end_date")
            if t_start and t_end and t_start <= end_date and t_end >= start_date:
                tech_id = t.get("technician_id") or "Sem Técnico"
                user = next((u for u in users_list if u["id"] == tech_id), None)
                tech_name = user["name"] if user else tech_id
                tech_hours[tech_name] = tech_hours.get(tech_name, 0) + (t.get("actual_hours", 0) or 0)
        
        # 3.2 Estado das Tarefas
        status_counts = {}
        for t in all_tasks:
            t_start = t.get("actual_start_date") or t.get("planned_start_date")
            t_end = t.get("actual_end_date") or t.get("planned_end_date")
            if t_start and t_end and t_start <= end_date and t_end >= start_date:
                status = t.get("status") or "Pendente"
                status_counts[status] = status_counts.get(status, 0) + 1

        # 4. Gerar Gráficos com Matplotlib
        # Gráfico 1: Horas por Técnico (Barra)
        fig1, ax1 = plt.subplots(figsize=(6, 4))
        if tech_hours:
            names = list(tech_hours.keys())
            hours = list(tech_hours.values())
            ax1.bar(names, hours, color='#3b82f6')
            ax1.set_title('Horas Reais por Técnico (Mês)')
            ax1.set_ylabel('Horas')
            plt.xticks(rotation=45, ha='right')
        else:
            ax1.text(0.5, 0.5, 'Sem dados de horas', ha='center', va='center')
        plt.tight_layout()
        img_buf1 = io.BytesIO()
        plt.savefig(img_buf1, format='png', dpi=150)
        img_buf1.seek(0)
        plt.close(fig1)

        # Gráfico 2: Estado das Tarefas (Pizza)
        fig2, ax2 = plt.subplots(figsize=(6, 4))
        if status_counts:
            labels = list(status_counts.keys())
            values = list(status_counts.values())
            colors = ['#94a3b8', '#f59e0b', '#10b981', '#ef4444']
            ax2.pie(values, labels=labels, autopct='%1.1f%%', startangle=140, colors=colors[:len(labels)])
            ax2.set_title('Distribuição de Estado das Tarefas')
        else:
            ax2.text(0.5, 0.5, 'Sem tarefas no período', ha='center', va='center')
        plt.tight_layout()
        img_buf2 = io.BytesIO()
        plt.savefig(img_buf2, format='png', dpi=150)
        img_buf2.seek(0)
        plt.close(fig2)

        # 5. Gerar PDF
        class PDF(FPDF):
            def header(self):
                self.set_font('Helvetica', 'B', 16)
                self.set_text_color(31, 41, 55)
                self.cell(0, 10, 'Relatório Mensal de Desenvolvimentos (Dashboard)', 0, 1, 'C')
                self.set_font('Helvetica', 'I', 10)
                self.cell(0, 5, f'Período: {start_date} a {end_date}', 0, 1, 'C')
                self.ln(10)

            def footer(self):
                self.set_y(-15)
                self.set_font('Helvetica', 'I', 8)
                self.set_text_color(107, 114, 128)
                self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

            def chapter_title(self, title):
                self.set_font('Helvetica', 'B', 12)
                self.set_fill_color(243, 244, 246)
                self.set_text_color(31, 41, 55)
                self.cell(0, 8, f" {title}", 0, 1, 'L', fill=True)
                self.ln(4)

        pdf = PDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        # Secção: Resumo Visual (KPIs)
        pdf.chapter_title("1. RESUMO VISUAL (KPIs)")
        
        # Inserir Gráficos
        x_half = (pdf.w - 20) / 2
        pdf.image(img_buf1, x=10, y=pdf.get_y(), w=90)
        pdf.image(img_buf2, x=105, y=pdf.get_y(), w=90)
        pdf.set_y(pdf.get_y() + 65) # Espaço para os gráficos
        pdf.ln(5)

        # Secção: Resumo de Projetos
        pdf.chapter_title("2. RESUMO DE PROJETOS")
        pdf.set_font('Helvetica', 'B', 9)
        pdf.set_fill_color(229, 231, 235)
        widths = [65, 30, 30, 35, 30]
        headers = ["Projeto", "Empresa", "Estado", "Responsável", "Horas (Mês)"]
        for i, h in enumerate(headers):
            pdf.cell(widths[i], 7, h, 1, 0, 'C', fill=True)
        pdf.ln()
        
        pdf.set_font('Helvetica', '', 8)
        for p in projects:
            p_tasks = [t for t in all_tasks if t["project_id"] == p["id"]]
            m_hours = sum(t.get("actual_hours", 0) or 0 for t in p_tasks if (t.get("actual_start_date") or t.get("planned_start_date") or "") <= end_date and (t.get("actual_end_date") or t.get("planned_end_date") or "") >= start_date)
            pdf.cell(widths[0], 6, str(p.get("name") or "")[:38], 1)
            pdf.cell(widths[1], 6, str(p.get("company") or ""), 1, 0, 'C')
            pdf.cell(widths[2], 6, str(p.get("status") or ""), 1, 0, 'C')
            pdf.cell(widths[3], 6, str(p.get("owner") or "")[:20], 1)
            pdf.cell(widths[4], 6, f"{m_hours}h", 1, 1, 'R')
        pdf.ln(8)

        # Secção: Fases (Gantt)
        pdf.chapter_title("3. FASES DE DESENVOLVIMENTO ATIVAS")
        pdf.set_font('Helvetica', 'B', 9)
        widths = [55, 45, 30, 25, 25, 10]
        headers = ["Projeto", "Fase", "Tipo", "Início", "Fim", "Hrs"]
        for i, h in enumerate(headers):
            pdf.cell(widths[i], 7, h, 1, 0, 'C', fill=True)
        pdf.ln()
        
        pdf.set_font('Helvetica', '', 8)
        for ph in phases:
            ph_start = ph.get("actual_start_date") or ph.get("planned_start_date")
            ph_end = ph.get("actual_end_date") or ph.get("planned_end_date")
            if ph_start and ph_end and ph_start <= end_date and ph_end >= start_date:
                proj_name = next((p["name"] for p in projects if p["id"] == ph["project_id"]), "N/A")
                pdf.cell(widths[0], 6, str(proj_name)[:30], 1)
                pdf.cell(widths[1], 6, str(ph.get("name") or "")[:25], 1)
                pdf.cell(widths[2], 6, str(ph.get("type") or ""), 1, 0, 'C')
                pdf.cell(widths[3], 6, str(ph_start), 1, 0, 'C')
                pdf.cell(widths[4], 6, str(ph_end), 1, 0, 'C')
                pdf.cell(widths[5], 6, str(ph.get('actual_hours', 0)), 1, 1, 'R')
        pdf.ln(8)

        # Secção: Reuniões
        pdf.chapter_title("4. REUNIÕES DE ACOMPANHAMENTO")
        pdf.set_font('Helvetica', 'B', 9)
        widths = [20, 55, 50, 10, 55]
        headers = ["Data", "Título", "Projeto", "Hrs", "Participantes"]
        for i, h in enumerate(headers):
            pdf.cell(widths[i], 7, h, 1, 0, 'C', fill=True)
        pdf.ln()
        
        pdf.set_font('Helvetica', '', 8)
        for m in meetings:
            proj_name = (m.get("projects") or {}).get("name") or ""
            pdf.cell(widths[0], 6, str(m.get("date") or ""), 1, 0, 'C')
            pdf.cell(widths[1], 6, str(m.get("title") or "")[:32], 1)
            pdf.cell(widths[2], 6, str(proj_name)[:28], 1)
            pdf.cell(widths[3], 6, str(m.get('duration_hours', 0)), 1, 0, 'C')
            pdf.cell(widths[4], 6, str(m.get("attendees") or "")[:35], 1, 1)
        
        # 6. Enviar PDF
        pdf_content = pdf.output(dest='S')
        output = io.BytesIO(pdf_content)
        output.seek(0)
        
        filename = f"Relatorio_Mensal_Grafico_{first_day_prev.month:02d}_{first_day_prev.year}.pdf"
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Erro na exportação mensal: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ─── PHASES ───────────────────────────────────────────────────────────────────

@app.route('/api/projects/<project_id>/phases', methods=['POST'])
def create_phase(project_id):
    try:
        data = request.json
        print(f"DEBUG: create_phase data={data}")
        payload = to_snake(data)
        payload["project_id"] = project_id
        
        if "planned_hours" not in payload: payload["planned_hours"] = 0
        
        # Ensure UUID and Date fields are not empty strings
        for field in ["project_id", "technician_id", "planned_start_date", "planned_end_date", "actual_start_date", "actual_end_date"]:
            if field in payload and not payload[field]:
                payload[field] = None

        print(f"DEBUG: create_phase payload={payload}")
        res = supabase.table("phases").insert(payload).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        print(f"DEBUG: create_phase error={str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/phases/<id>', methods=['PUT'])
def update_phase(id):
    try:
        data = request.json
        payload = to_snake(data)
        payload.pop("id", None)

        # Ensure Date fields are not empty strings
        for field in ["planned_start_date", "planned_end_date", "actual_start_date", "actual_end_date"]:
            if field in payload and not payload[field]:
                payload[field] = None

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
        payload = to_snake(data)
        if "status" not in payload: payload["status"] = "Pendente"
        if "planned_hours" not in payload: payload["planned_hours"] = 0

        # Ensure UUID and Date fields are not empty strings
        for field in ["project_id", "phase_id", "technician_id", "planned_start_date", "planned_end_date", "actual_start_date", "actual_end_date"]:
            if field in payload and not payload[field]:
                payload[field] = None

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

        # Ensure Date fields are not empty strings
        for field in ["planned_start_date", "planned_end_date", "actual_start_date", "actual_end_date"]:
            if field in payload and not payload[field]:
                payload[field] = None

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

# ─── MEETINGS ─────────────────────────────────────────────────────────────────

@app.route('/api/meetings', methods=['GET'])
def get_meetings():
    try:
        res = supabase.table("meetings").select("*, projects(name)").execute()
        meetings = res.data

        for m in meetings:
            m["project_name"] = (m.pop("projects", None) or {}).get("name", "")

        return jsonify(meetings)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/meetings', methods=['POST'])
def create_meeting():
    try:
        data = request.json
        payload = to_snake(data)
        
        # Garante o project_id como None se for vazio
        if "project_id" in payload and not payload["project_id"]:
            payload["project_id"] = None
            
        res = supabase.table("meetings").insert(payload).execute()
        
        if not res.data:
            return jsonify({"error": "Não foi possível criar a reunião"}), 400
            
        new_meeting = res.data[0]
        new_meeting["project_name"] = ""

        if new_meeting.get("project_id"):
            proj_res = supabase.table("projects").select("name").eq("id", new_meeting["project_id"]).single().execute()
            if proj_res.data:
                new_meeting["project_name"] = proj_res.data.get("name", "")

        return jsonify(new_meeting), 201
    except Exception as e:
        print(f"ERRO CREATE MEETING: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/meetings/<id>', methods=['PUT'])
def update_meeting(id):
    try:
        data = request.json
        payload = to_snake(data)
        
        # Remove campos que não devem ser atualizados
        payload.pop("id", None)
        payload.pop("project_name", None)
        
        if "project_id" in payload and not payload["project_id"]:
            payload["project_id"] = None

        res = supabase.table("meetings").update(payload).eq("id", id).execute()
        
        if not res.data:
            return jsonify({"error": "Reunião não encontrada ou erro na atualização"}), 404
            
        return jsonify(res.data[0])
    except Exception as e:
        print(f"ERRO UPDATE MEETING: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/meetings/<id>', methods=['DELETE'])
def delete_meeting(id):
    try:
        supabase.table("meetings").delete().eq("id", id).execute()
        return '', 204
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ─── USERS MANAGEMENT ─────────────────────────────────────────────────────────

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        res = supabase.table("users").select("id, username, name, color, role, created_at").execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")
        name = data.get("name")
        color = data.get("color", "#6366f1")
        
        if not username or not password:
            return jsonify({"error": "Faltam campos obrigatórios"}), 400

        payload = {
            "username": username,
            "name": name or username,
            "password_hash": generate_password_hash(password),
            "color": color,
            "role": data.get("role", "técnico")
        }
        
        print(f"DEBUG: Creating user with payload: {payload}")
        res = supabase.table("users").insert(payload).execute()
        print(f"DEBUG: Supabase response: {res.data}")
        if res.data:
            user = res.data[0]
            del user["password_hash"]
            return jsonify(user), 201
        return jsonify({"error": "Não foi possível criar o utilizador"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users/<id>', methods=['PUT'])
def update_user(id):
    try:
        data = request.json
        payload = {}
        if "name" in data: payload["name"] = data["name"]
        if "username" in data: payload["username"] = data["username"]
        if "color" in data: payload["color"] = data["color"]
        if "role" in data: payload["role"] = data["role"]
        
        # Se password for enviada, atualiza também
        if "password" in data and data["password"]:
            payload["password_hash"] = generate_password_hash(data["password"])

        print(f"DEBUG: Updating user {id} with payload: {payload}")
        res = supabase.table("users").update(payload).eq("id", id).execute()
        print(f"DEBUG: Supabase response for update: {res.data}")
        
        if res.data:
            user = res.data[0]
            if "password_hash" in user: del user["password_hash"]
            return jsonify(user)
        return jsonify({"error": "Utilizador não encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users/<id>', methods=['DELETE'])
def delete_user(id):
    try:
        # Não permite apagar o admin original
        user_res = supabase.table("users").select("username").eq("id", id).single().execute()
        if user_res.data and user_res.data["username"] == "admin":
            return jsonify({"error": "Não é possível apagar o utilizador administrador"}), 403

        supabase.table("users").delete().eq("id", id).execute()
        return '', 204
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)
