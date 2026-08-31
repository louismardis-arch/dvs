// ============================================================
// v3.16 — صفحة LIVRAISON الاحترافية (شكل + مضمون)
// تصميم جدولي نقي بحال أنظمة إدارة الطلبيات الكبار:
// هيدر + مؤشرات حية + تبويبات الحالات + جدول أنيق + سطر تفاصيل قابل للتوسيع
// نفس منطق v3.12: الداطا من orders، الفريز من تمن المدينة (LES VILLES)،
// Retour/Annulé = 0 DH — الألوان inline + كلاسات lvx- محلية
// ============================================================

const LvC = {
    "À préparer": "#64748b",
    "Préparé": "#0284c7",
    "Expédié": "#7c3aed",
    "En livraison": "#d97706",
    "Livré": "#16a34a",
    "Refusé": "#e11d48",
    "Retour": "#9333ea",
    "Annulé": "#dc2626",
    "Problème livraison": "#be123c"
};
const avCol = n => ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"][String(n || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 7];

function Liv() {
    const { orders: o, upd: uo } = Xt();
    const [sh, G] = ee.useState("");
    const [flt, Flt] = ee.useState("all");
    const [opn, Opn] = ee.useState(null);
    const cities = Ll();
    const NF = x => Number(x || 0).toLocaleString("fr-FR");
    const col = x => {
        if (String(x.statut) === "Annulé") return "Annulé";
        const L = x.livraison || "";
        return L === "Livrée" ? "Livré" : L === "Expédier vers" ? "Expédié" : L === "Out Of Stock" ? "Problème livraison" : LSts.includes(L) ? L : "À préparer"
    };
    const setCol = (x, st) => {
        if (st === "Annulé") return uo(x.id, { statut: "Annulé" });
        const P = x.statut === "Annulé" ? { statut: "Confirmé" } : {};
        return uo(x.id, { ...P, livraison: st === "Livré" ? "Livrée" : st })
    };
    const frais = x => (x.livraison === "Retour" || String(x.statut) === "Annulé") ? 0 : (wo(x.ville, cities) ?? 0);
    const shown = sh ? o.filter(x => [x.idCmd, x.nom, x.telephone, x.ville, x.adresse, x.produit, x.agent, x.tracking, x.livreur].join(" ").toLowerCase().includes(sh.toLowerCase())) : o;
    const inC = c => x => col(x) === c;
    const list = flt === "all" ? shown : shown.filter(inC(flt));
    const cnt = st => st === "all" ? shown.length : shown.filter(inC(st)).length;
    const kPrep = shown.filter(x => ["À préparer", "Préparé"].includes(col(x))).length;
    const kRoad = shown.filter(x => ["Expédié", "En livraison"].includes(col(x))).length;
    const kDone = shown.filter(inC("Livré")).length;
    const kBad = shown.filter(x => ["Refusé", "Retour", "Annulé", "Problème livraison"].includes(col(x))).length;
    const kCA = shown.filter(inC("Livré")).reduce((a, x) => a + (Number(x.qte) || 0) * (Number(x.prix) || 0), 0);
    const kFrais = shown.reduce((a, x) => a + frais(x), 0);
    const STATS = [
        { k: "prep", t: "قيد التجهيز", v: NF(kPrep), c: "#f59e0b" },
        { k: "road", t: "فـ الطريق", v: NF(kRoad), c: "#8b5cf6" },
        { k: "done", t: "توصّلو", v: NF(kDone), c: "#10b981" },
        { k: "bad", t: "رجوع / إلغاء", v: NF(kBad), c: "#ef4444" },
        { k: "ca", t: "المبيعات الموصّلة", v: NF(kCA) + " DH", c: "#0f172a" },
        { k: "frais", t: "مجموع الفريز", v: NF(kFrais) + " DH", c: "#0f172a" }
    ];
    const TABS = [["all", "الكل", "#0f172a"], ...LCo.map(([st]) => [st, st, LvC[st] || "#64748b"])];
    const FLabel = t => s.jsx("div", { style: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 4 }, children: t });
    const FInput = p => s.jsx("input", { className: "lvx-input", style: { width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 11.5, fontWeight: 600, color: "#0f172a", outline: "none" }, ...p });
    const FText = v => s.jsx("div", { style: { fontSize: 11.5, fontWeight: 600, color: "#334155", paddingTop: 3 }, children: v || "—" });
    const Th = (t, stl) => s.jsx("th", { style: { fontSize: 9.5, fontWeight: 800, color: "#64748b", letterSpacing: ".04em", textAlign: "right", padding: "10px 14px", whiteSpace: "nowrap", ...(stl || {}) }, children: t });
    const rowDetail = x => {
        const st = col(x);
        return s.jsx("tr", {
            key: "d" + x.id,
            className: "lvx-in",
            children: s.jsx("td", {
                colSpan: 8,
                style: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 18px 14px" },
                children: s.jsx("div", {
                    style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px 16px" },
                    children: [
                        s.jsx("div", { children: [FLabel("LIVREUR"), FInput({ value: x.livreur || "", onChange: e => uo(x.id, { livreur: e.target.value }), placeholder: "اسم اللي كيوصّل..." })] }),
                        s.jsx("div", { children: [FLabel("Tracking ID — شركة الشحن"), s.jsx("input", { className: "lvx-input", value: x.tracking || "", onChange: e => uo(x.id, { tracking: e.target.value }), placeholder: "TRK-...", style: { width: "100%", boxSizing: "border-box", border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 8, padding: "7px 10px", fontSize: 11.5, fontWeight: 700, color: "#b45309", outline: "none" } })] }),
                        s.jsx("div", { children: [FLabel("تاريخ الشحن"), FInput({ type: "date", value: x.dateExp || "", onChange: e => uo(x.id, { dateExp: e.target.value }) })] }),
                        s.jsx("div", { children: [FLabel("تاريخ التوصيل"), FInput({ type: "date", value: x.dateLiv || "", onChange: e => uo(x.id, { dateLiv: e.target.value }) })] }),
                        (st === "Retour" || st === "Problème livraison" || x.motif) ? s.jsx("div", { children: [FLabel("سبب الإرجاع"), s.jsx("input", { className: "lvx-input", value: x.motif || "", onChange: e => uo(x.id, { motif: e.target.value }), placeholder: "سبب الإرجاع...", style: { width: "100%", boxSizing: "border-box", border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, padding: "7px 10px", fontSize: 11.5, fontWeight: 600, color: "#b91c1c", outline: "none" } })] }) : null,
                        s.jsx("div", { children: [FLabel("العنوان"), FText(x.adresse)] }),
                        s.jsx("div", { children: [FLabel("الهاتف"), s.jsx("div", { style: { fontSize: 11.5, fontWeight: 600, color: "#334155", paddingTop: 3, direction: "ltr", textAlign: "right" }, children: x.telephone || "—" })] }),
                        s.jsx("div", { children: [FLabel("البائع"), FText(x.agent)] })
                    ]
                })
            })
        })
    };
    const row = x => {
        const st = col(x);
        const cc = LvC[st] || "#64748b";
        const isAnn = st === "Annulé";
        const selC = isAnn ? "#64748b" : cc;
        const annS = isAnn ? { textDecoration: "line-through", textDecorationColor: "#dc2626", textDecorationThickness: "2px" } : null;
        const frx = frais(x);
        const tot = (Number(x.qte) || 0) * (Number(x.prix) || 0);
        const ini = String(x.nom || "?").trim().charAt(0) || "?";
        const av = avCol(x.nom);
        const open = opn === x.id;
        const dt = String(x.dateCreation || "").slice(0, 10);
        return s.jsx("tr", {
            key: x.id,
            "data-cmd": x.idCmd || x.id,
            className: "lvx-row",
            style: { borderBottom: "1px solid #f1f5f9", background: open ? "#f5f9ff" : "#fff", cursor: "pointer" },
            onClick: () => Opn(v => v === x.id ? null : x.id),
            children: [
                s.jsx("td", {
                    style: { padding: "10px 14px", whiteSpace: "nowrap", verticalAlign: "top" },
                    children: [
                        s.jsx("b", { style: { display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", ...(annS || {}) }, children: "#" + (x.idCmd || x.id) }),
                        dt ? s.jsx("span", { style: { display: "block", fontSize: 9.5, fontWeight: 600, color: "#cbd5e1", direction: "ltr", textAlign: "right", marginTop: 2 }, children: dt.split("-").reverse().join("/") }) : null
                    ]
                }),
                s.jsx("td", {
                    style: { padding: "10px 14px", verticalAlign: "top" },
                    children: s.jsxs("div", {
                        style: { display: "flex", alignItems: "center", gap: 9 },
                        children: [
                            s.jsx("span", { style: { width: 28, height: 28, borderRadius: 9, background: av + "1a", color: av, display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 800, flexShrink: 0 }, children: ini }),
                            s.jsxs("div", {
                                style: { minWidth: 0 },
                                children: [
                                    s.jsx("div", { style: { fontSize: 11.5, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170, ...(annS || {}) }, children: x.nom || "—" }),
                                    x.telephone ? s.jsx("div", { style: { fontSize: 10, fontWeight: 600, color: "#94a3b8", direction: "ltr", textAlign: "right", marginTop: 1, ...(annS || {}) }, children: x.telephone }) : null
                                ]
                            })
                        ]
                    })
                }),
                s.jsx("td", {
                    style: { padding: "10px 14px", verticalAlign: "top" },
                    children: s.jsxs("span", { title: "فريز هاد المدينة محدد فـ LES VILLES", style: { fontSize: 11.5, fontWeight: 600, color: "#334155", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", ...(annS || {}) }, children: [s.jsx("span", { style: { fontSize: 10, opacity: .85 }, children: "📍" }), x.ville || "—"] })
                }),
                s.jsx("td", {
                    style: { padding: "10px 14px", verticalAlign: "top", maxWidth: 210 },
                    children: s.jsxs("div", { style: { fontSize: 11.5, fontWeight: 600, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...(annS || {}) }, children: [x.produit || "—", (Number(x.qte) || 0) > 1 ? s.jsx("span", { style: { color: "#94a3b8", fontWeight: 700, marginInlineStart: 5 }, children: "×" + x.qte }) : null] })
                }),
                s.jsx("td", {
                    style: { padding: "10px 14px", verticalAlign: "top", textAlign: "center", whiteSpace: "nowrap" },
                    children: s.jsx("b", { style: { fontSize: 12, fontWeight: 800, color: "#0f172a", ...(annS || {}) }, children: [NF(tot), " DH"] })
                }),
                s.jsx("td", {
                    "data-frais": frx,
                    style: { padding: "10px 14px", verticalAlign: "top", textAlign: "center", whiteSpace: "nowrap" },
                    children: s.jsx("b", { title: frx > 0 ? "من LES VILLES" : "Retour / Annulé ولا المدينة ماشي فاللائحة = 0 DH", style: { fontSize: 11.5, fontWeight: 800, color: frx > 0 ? "#b45309" : "#94a3b8", ...(annS || {}) }, children: [NF(frx), " DH"] })
                }),
                s.jsx("td", {
                    style: { padding: "6px 14px", verticalAlign: "top", whiteSpace: "nowrap" },
                    children: s.jsx("select", {
                        value: st,
                        onChange: e => setCol(x, e.target.value),
                        onClick: e => e.stopPropagation(),
                        className: "lvx-sel",
                        title: "بدّل حالة التوصيل",
                        style: { border: "1px solid " + selC + "55", background: selC + "0f", color: selC, borderRadius: 8, fontSize: 10.5, fontWeight: 800, padding: "5px 26px 5px 10px", outline: "none", cursor: "pointer", maxWidth: 132 },
                        children: LSts.map(v => s.jsx("option", { value: v, children: v }, v))
                    })
                }),
                s.jsx("td", {
                    style: { padding: "6px 10px", verticalAlign: "top", textAlign: "center" },
                    children: s.jsx("button", {
                        onClick: e => {
                            e.stopPropagation();
                            Opn(v => v === x.id ? null : x.id)
                        },
                        className: "lvx-chev" + (open ? " lvx-open" : ""),
                        title: open ? "سدّ التفاصيل" : "شوف تفاصيل الشحن",
                        style: { width: 26, height: 26, borderRadius: 8, border: "1px solid #e2e8f0", background: open ? "#eef2ff" : "#fff", color: "#64748b", cursor: "pointer", fontSize: 10, display: "inline-grid", placeItems: "center" },
                        children: "▾"
                    })
                })
            ]
        })
    };
    return s.jsx("div", {
        dir: "rtl",
        className: "h-full overflow-auto",
        style: { background: "#f1f5f9", padding: "16px 20px 26px" },
        children: s.jsx("div", {
            style: { maxWidth: 1400, margin: "0 auto" },
            children: [
                s.jsx("div", {
                    style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "13px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 1px 2px rgba(15,23,42,.04)" },
                    children: [
                        s.jsx("span", { style: { width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#f97316,#d97706)", color: "#fff", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0, boxShadow: "0 6px 14px rgba(217,119,6,.3)" }, children: "🚚" }),
                        s.jsx("div", {
                            style: { minWidth: 0 },
                            children: [
                                s.jsx("div", { style: { fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 1 }, children: "الرئيسية › ليفريزون" }),
                                s.jsx("h1", { style: { fontSize: 17.5, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em", margin: 0, lineHeight: 1.2 }, children: "LIVRAISON" }),
                                s.jsx("p", { style: { fontSize: 10.5, color: "#64748b", margin: 0 }, children: "إدارة توصيل الطلبيات — مربوطة أوتوماتيكياً مع صفحة الطلبيات" })
                            ]
                        }),
                        s.jsx("span", { style: { borderRadius: 99, background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c", padding: "4px 12px", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }, children: [NF(o.length), " طلبية"] }),
                        s.jsx("div", {
                            style: { marginInlineStart: "auto", position: "relative" },
                            children: [
                                s.jsx("span", { style: { position: "absolute", insetInlineStart: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, pointerEvents: "none" }, children: "🔎" }),
                                s.jsx("input", {
                                    value: sh,
                                    onChange: e => G(e.target.value),
                                    placeholder: "بحث (N° / Client / Téléphone / Ville / Produit)...",
                                    className: "lvx-input",
                                    style: { width: "100%", boxSizing: "border-box", minWidth: 280, border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", padding: "8px 12px 8px 32px", fontSize: 11.5, fontWeight: 600, color: "#0f172a", outline: "none" }
                                })
                            ]
                        })
                    ]
                }),
                s.jsx("div", {
                    style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 12 },
                    children: STATS.map(k => s.jsx("div", {
                        key: k.k,
                        "data-kpi": k.k,
                        style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 13px", position: "relative", overflow: "hidden" },
                        children: [
                            s.jsx("span", { style: { position: "absolute", insetInlineStart: 0, top: 10, bottom: 10, width: 3, borderRadius: 99, background: k.c } }),
                            s.jsx("div", { style: { fontSize: 9.5, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 3 }, children: k.t }),
                            s.jsx("b", { style: { display: "block", fontSize: 15.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }, children: k.v })
                        ]
                    }))
                }),
                s.jsx("div", {
                    className: "lvx-scroll",
                    style: { display: "flex", gap: 7, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "thin" },
                    children: TABS.map(([k, label, cc]) => {
                        const on = flt === k;
                        const c2 = k === "all" ? "#0f172a" : cc;
                        return s.jsx("button", {
                            key: k,
                            "data-tab": k,
                            onClick: () => Flt(k),
                            className: "lvx-tab",
                            style: {
                                display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0,
                                border: "1px solid " + (on ? c2 : "#e2e8f0"), background: on ? c2 : "#fff", color: on ? "#fff" : "#475569",
                                borderRadius: 10, padding: "6px 12px", fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                                boxShadow: on ? "0 3px 8px " + c2 + "30" : "none"
                            },
                            children: [
                                k === "all" ? null : s.jsx("span", { style: { width: 6, height: 6, borderRadius: 99, background: on ? "rgba(255,255,255,.85)" : c2 }, children: null }),
                                label,
                                s.jsx("span", { style: { background: on ? "rgba(255,255,255,.2)" : "#f1f5f9", color: on ? "#fff" : "#64748b", borderRadius: 99, padding: "0 7px", fontSize: 9.5, fontWeight: 800, lineHeight: "16px" }, children: cnt(k) })
                            ]
                        })
                    })
                }),
                s.jsx("div", {
                    style: { display: "flex", flexWrap: "wrap", gap: "6px 16px", alignItems: "center", marginBottom: 12, padding: "0 2px" },
                    children: [
                        s.jsxs("span", { style: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8" }, children: ["🔗 هاد الصفحة ", s.jsx("b", { style: { color: "#64748b", fontWeight: 800 }, children: "مربوطة مع Commandes" }), " — الداطا كتجي أوتوماتيك من الطلبيات، وكل تبديل كيتسجل فالـ CRM ديال الجميع."] }),
                        s.jsxs("span", { style: { fontSize: 10.5, fontWeight: 600, color: "#94a3b8" }, children: ["💡 الفريز حسب تمن المدينة فـ ", s.jsx("b", { style: { color: "#64748b", fontWeight: 800 }, children: "LES VILLES" }), " — أي مدينة تزيدها هناك كتطبق أوتوماتيك هنا · ↩️ Retour و ✖️ Annulé = 0 DH"] })
                    ]
                }),
                s.jsx("div", {
                    style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(15,23,42,.04)" },
                    children: s.jsx("div", {
                        style: { overflowX: "auto" },
                        children: s.jsxs("table", {
                            style: { width: "100%", borderCollapse: "collapse", minWidth: 860 },
                            children: [
                                s.jsx("thead", {
                                    children: s.jsx("tr", {
                                        style: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
                                        children: [Th("#"), Th("العميل"), Th("المدينة"), Th("المنتج"), Th("المجموع", { textAlign: "center" }), Th("Frais livraison", { textAlign: "center" }), Th("الحالة"), Th("", { width: 46 })]
                                    })
                                }),
                                s.jsx("tbody", {
                                    children: [
                                        ...list.map(x => [row(x), opn === x.id ? rowDetail(x) : null]),
                                        list.length ? null : s.jsx("tr", {
                                            children: s.jsx("td", {
                                                colSpan: 8,
                                                style: { padding: "46px 20px", textAlign: "center" },
                                                children: [
                                                    s.jsx("div", { style: { fontSize: 26, marginBottom: 8 }, children: "🚚" }),
                                                    s.jsx("div", { style: { fontSize: 12, fontWeight: 800, color: "#64748b" }, children: sh || flt !== "all" ? "ما كاين حتى نتيجة فهاد الفيلتر / البحث" : "ما كاين حتى طلبية فالـ CRM" }),
                                                    s.jsx("div", { style: { fontSize: 10.5, fontWeight: 600, color: "#cbd5e1", marginTop: 4 }, children: "الطلبيات كيجيو أوتوماتيك من صفحة Commandes — سجّل طلبية وكتلقاها هنا" })
                                                ]
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    })
                })
            ]
        })
    })
}
