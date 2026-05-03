// ============================================================
// Tactical Toolbox Service — 62 مهارة Aiden
// واجهة تشغيل المهام وعرض النتائج كـ terminal
// ============================================================

export interface AidenSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon: string;
  command?: string;
  dangerous?: boolean;
}

export type SkillCategory =
  | "network"
  | "security"
  | "system"
  | "files"
  | "code"
  | "ai"
  | "automation"
  | "recon";

export interface SkillResult {
  skillId: string;
  output: string;
  exitCode?: number;
  duration: number;
  timestamp: number;
  streaming?: boolean;
}

// ── 62 Aiden Skills ─────────────────────────────────────────

export const AIDEN_SKILLS: AidenSkill[] = [
  // Network
  { id: "nmap_quick", name: "Nmap Quick Scan", description: "فحص سريع للمنافذ المفتوحة", category: "network", icon: "radio" },
  { id: "nmap_full", name: "Nmap Full Scan", description: "فحص شامل لجميع المنافذ", category: "network", icon: "activity" },
  { id: "nmap_vuln", name: "Nmap Vuln Scan", description: "كشف الثغرات عبر Nmap scripts", category: "network", icon: "alert-triangle", dangerous: true },
  { id: "ping_sweep", name: "Ping Sweep", description: "اكتشاف الأجهزة الحية في الشبكة", category: "network", icon: "wifi" },
  { id: "traceroute", name: "Traceroute", description: "تتبع مسار الحزم عبر الشبكة", category: "network", icon: "navigation" },
  { id: "arp_scan", name: "ARP Scan", description: "اكتشاف الأجهزة عبر ARP", category: "network", icon: "share-2" },
  { id: "netstat", name: "Netstat", description: "عرض الاتصالات الشبكية النشطة", category: "network", icon: "link" },
  { id: "dns_lookup", name: "DNS Lookup", description: "استعلام DNS", category: "network", icon: "globe" },
  { id: "whois", name: "Whois Lookup", description: "معلومات تسجيل النطاق", category: "network", icon: "info" },
  { id: "ssl_check", name: "SSL Check", description: "فحص شهادة SSL/TLS", category: "network", icon: "lock" },

  // Security
  { id: "nikto_scan", name: "Nikto Web Scanner", description: "فحص ثغرات تطبيقات الويب", category: "security", icon: "shield", dangerous: true },
  { id: "sqlmap_detect", name: "SQLMap Detect", description: "كشف ثغرات SQL Injection", category: "security", icon: "database", dangerous: true },
  { id: "hydra_ssh", name: "Hydra SSH Test", description: "اختبار كلمات المرور SSH", category: "security", icon: "key", dangerous: true },
  { id: "john_crack", name: "John The Ripper", description: "كسر الهاشات المشفرة", category: "security", icon: "unlock", dangerous: true },
  { id: "hash_identify", name: "Hash Identifier", description: "تحديد نوع الهاش", category: "security", icon: "hash" },
  { id: "encode_base64", name: "Base64 Encode", description: "ترميز Base64", category: "security", icon: "code" },
  { id: "decode_base64", name: "Base64 Decode", description: "فك ترميز Base64", category: "security", icon: "code" },
  { id: "steghide", name: "Steghide Extract", description: "استخراج بيانات مخفية في الصور", category: "security", icon: "image", dangerous: true },
  { id: "metasploit_search", name: "MSF Search", description: "البحث في قاعدة بيانات Metasploit", category: "security", icon: "search", dangerous: true },
  { id: "burp_intercept", name: "Burp Intercept", description: "بدء اعتراض حركة HTTP", category: "security", icon: "sliders", dangerous: true },

  // System
  { id: "top_processes", name: "Top Processes", description: "عرض أكثر العمليات استهلاكاً", category: "system", icon: "cpu" },
  { id: "disk_usage", name: "Disk Usage", description: "تحليل استخدام القرص", category: "system", icon: "hard-drive" },
  { id: "memory_info", name: "Memory Info", description: "معلومات الذاكرة RAM", category: "system", icon: "server" },
  { id: "cpu_info", name: "CPU Info", description: "معلومات المعالج", category: "system", icon: "zap" },
  { id: "uptime", name: "System Uptime", description: "مدة تشغيل النظام", category: "system", icon: "clock" },
  { id: "kernel_info", name: "Kernel Info", description: "معلومات نواة النظام", category: "system", icon: "terminal" },
  { id: "users_logged", name: "Logged Users", description: "المستخدمون المسجلون حالياً", category: "system", icon: "users" },
  { id: "cron_jobs", name: "Cron Jobs", description: "عرض المهام المجدولة", category: "system", icon: "calendar" },
  { id: "env_vars", name: "Env Variables", description: "عرض متغيرات البيئة", category: "system", icon: "list" },
  { id: "systemctl_status", name: "Services Status", description: "حالة الخدمات النشطة", category: "system", icon: "settings" },

  // Files
  { id: "find_files", name: "Find Files", description: "البحث في نظام الملفات", category: "files", icon: "folder" },
  { id: "file_permissions", name: "File Permissions", description: "فحص صلاحيات الملفات", category: "files", icon: "shield" },
  { id: "find_suid", name: "Find SUID", description: "البحث عن ملفات SUID/SGID", category: "files", icon: "alert-circle", dangerous: true },
  { id: "compress_zip", name: "Compress ZIP", description: "ضغط الملفات إلى ZIP", category: "files", icon: "archive" },
  { id: "extract_zip", name: "Extract ZIP", description: "فك ضغط ملفات ZIP", category: "files", icon: "package" },
  { id: "file_hash", name: "File Hash (SHA256)", description: "حساب هاش SHA256 للملفات", category: "files", icon: "hash" },
  { id: "list_hidden", name: "List Hidden Files", description: "عرض الملفات المخفية", category: "files", icon: "eye" },
  { id: "file_metadata", name: "File Metadata", description: "قراءة بيانات الملف الوصفية", category: "files", icon: "info" },

  // Code
  { id: "git_status", name: "Git Status", description: "حالة مستودع Git", category: "code", icon: "git-branch" },
  { id: "git_log", name: "Git Log", description: "سجل الـ commits", category: "code", icon: "git-commit" },
  { id: "python_run", name: "Run Python Script", description: "تشغيل سكريبت Python", category: "code", icon: "play" },
  { id: "bash_run", name: "Run Bash Script", description: "تشغيل سكريبت Bash", category: "code", icon: "terminal" },
  { id: "code_explain", name: "Explain Code", description: "شرح الكود بالذكاء الاصطناعي", category: "code", icon: "book-open" },
  { id: "code_fix", name: "Fix Code Errors", description: "إصلاح أخطاء الكود", category: "code", icon: "tool" },
  { id: "regex_test", name: "Regex Tester", description: "اختبار تعبيرات Regex", category: "code", icon: "filter" },
  { id: "json_format", name: "Format JSON", description: "تنسيق وتحقق JSON", category: "code", icon: "code" },

  // AI
  { id: "analyze_text", name: "Analyze Text", description: "تحليل النصوص بالذكاء الاصطناعي", category: "ai", icon: "type" },
  { id: "summarize", name: "Summarize", description: "تلخيص المحتوى", category: "ai", icon: "align-left" },
  { id: "translate", name: "Translate Text", description: "ترجمة النصوص", category: "ai", icon: "globe" },
  { id: "generate_report", name: "Generate Report", description: "إنشاء تقارير احترافية", category: "ai", icon: "file-text" },
  { id: "sentiment_analysis", name: "Sentiment Analysis", description: "تحليل المشاعر في النصوص", category: "ai", icon: "heart" },
  { id: "extract_entities", name: "Extract Entities", description: "استخراج الكيانات من النص", category: "ai", icon: "tag" },
  { id: "vision_analyze", name: "Vision Analyze", description: "تحليل الصور بالذكاء الاصطناعي", category: "ai", icon: "eye" },

  // Automation
  { id: "schedule_task", name: "Schedule Task", description: "جدولة مهمة تلقائية", category: "automation", icon: "clock" },
  { id: "monitor_file", name: "Monitor File", description: "مراقبة تغييرات الملف", category: "automation", icon: "bell" },
  { id: "auto_backup", name: "Auto Backup", description: "نسخ احتياطي تلقائي", category: "automation", icon: "save" },
  { id: "web_scrape", name: "Web Scrape", description: "استخراج بيانات من الويب", category: "automation", icon: "download" },
  { id: "api_call", name: "API Call", description: "استدعاء API خارجي", category: "automation", icon: "send" },
  { id: "batch_process", name: "Batch Process", description: "معالجة دفعية للملفات", category: "automation", icon: "layers" },

  // Recon
  { id: "shodan_search", name: "Shodan Search", description: "البحث في قاعدة Shodan", category: "recon", icon: "search", dangerous: true },
  { id: "osint_domain", name: "OSINT Domain", description: "جمع معلومات عن النطاق", category: "recon", icon: "globe", dangerous: true },
  { id: "email_recon", name: "Email Recon", description: "البحث عن ايميلات النطاق", category: "recon", icon: "mail", dangerous: true },
  { id: "social_recon", name: "Social Media Recon", description: "بحث OSINT في الشبكات الاجتماعية", category: "recon", icon: "users", dangerous: true },
  { id: "subdomain_enum", name: "Subdomain Enum", description: "تعداد النطاقات الفرعية", category: "recon", icon: "server", dangerous: true },
];

// ── Run a skill via Aiden ────────────────────────────────────

export async function runSkill(
  serverUrl: string,
  skill: AidenSkill,
  params: Record<string, string>,
  onOutput: (line: string) => void,
  onDone: (result: SkillResult) => void,
): Promise<void> {
  const base = serverUrl.replace(/\/$/, "");
  const start = Date.now();

  try {
    const message = buildSkillMessage(skill, params);

    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream,application/json",
      },
      body: JSON.stringify({
        message,
        session: `tactical-${skill.id}`,
        mode: "stream",
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errText = `[Error] HTTP ${res.status}`;
      onOutput(errText);
      onDone({ skillId: skill.id, output: errText, exitCode: res.status, duration: Date.now() - start, timestamp: Date.now() });
      return;
    }

    const ct = res.headers.get("content-type") ?? "";
    let fullOutput = "";

    if (ct.includes("application/json") && !ct.includes("event-stream")) {
      const data = await res.json();
      const text = data.message ?? data.response ?? JSON.stringify(data);
      onOutput(text);
      onDone({ skillId: skill.id, output: text, exitCode: 0, duration: Date.now() - start, timestamp: Date.now() });
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onOutput("[Error] No stream body");
      onDone({ skillId: skill.id, output: "", exitCode: 1, duration: Date.now() - start, timestamp: Date.now() });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ":") continue;
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.token) { onOutput(chunk.token); fullOutput += chunk.token; }
          } catch { /* skip */ }
        }
      }
    }

    onDone({ skillId: skill.id, output: fullOutput, exitCode: 0, duration: Date.now() - start, timestamp: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onOutput(`[Error] ${msg}`);
    onDone({ skillId: skill.id, output: msg, exitCode: 1, duration: Date.now() - start, timestamp: Date.now() });
  }
}

function buildSkillMessage(skill: AidenSkill, params: Record<string, string>): string {
  const paramStr = Object.entries(params)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const base = `نفّذ مهارة "${skill.name}": ${skill.description}`;
  return paramStr ? `${base}. المعاملات: ${paramStr}` : base;
}

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  network: "الشبكة",
  security: "الأمان",
  system: "النظام",
  files: "الملفات",
  code: "الكود",
  ai: "الذكاء الاصطناعي",
  automation: "الأتمتة",
  recon: "الاستطلاع",
};

export const SKILL_CATEGORY_COLORS: Record<SkillCategory, string> = {
  network: "#3b82f6",
  security: "#ef4444",
  system: "#8b5cf6",
  files: "#f59e0b",
  code: "#10b981",
  ai: "#ec4899",
  automation: "#06b6d4",
  recon: "#f97316",
};
