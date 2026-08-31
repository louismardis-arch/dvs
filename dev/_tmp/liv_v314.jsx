// ============================================================
// v3.14 — صفحة LIVRAISON الاحترافية (تصميم مؤسساتي)
// نفس منطق v3.12: الداطا من orders، frais من LES VILLES،
// Retour / Annulé = 0 DH — الألوان inline + كلاسات lvx- محلية
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

const avCol = n => ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"][(String(n || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 7];

function LivCard({ x, col, setCol, uo, NF, frais, open, onToggle }) {
    const st = col(x);
    const cc = LvC[st] || "#64748b";
    const frx = frais(x);
    const tot = (Number(x.qte) || 0) * (Number(x.prix) || 0);
    const ini = String(x.nom || "?").trim().charAt(0) || "?";
    const av = avCol(x.nom);
    const Rw = (ic, lbl, val, vc) => s.jsx("div", {
        style: { minWidth: 0 },
        children: [s.jsx("div", {
            style: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em" },
            children: lbl
        }), s.jsx("div", {
            style: { fontSize: 11, fontWeight: 700, color: vc || "#334155", marginTop: 2, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
            children: [ic ? s.jsx("span", { style: { flexShrink: 0, fontSize: 10 }, children: ic }) : null, s.jsx("span", { children: val })]
        })]
    });
    return s.jsx("div", {
        className: "lvx-card lvx-in",
        "data-cmd": x.idCmd || x.id,
        style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, boxShadow: "0 1px 2px rgba(15,23,42,.05)" },
        children: [
            s.jsx("div", {
                style: { display: "flex", alignItems: "center", gap: 8 },
                children: [
                    s.jsx("span", {
                        style: { width: 32, height: 32, borderRadius: 10, background: av + "1a", color: av, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 },
                        children: ini
                    }),
                    s.jsx("div", {
                        style: { flex: 1, minWidth: 0 },
                        children: [
                            s.jsx("b", {
                                style: { display: "block", fontSize: 12, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                                children: x.nom || "—"
                            }),
                            s.jsx("b", {
                                style: { display: "block", fontSize: 9.5, fontWeight: 600, color: "#94a3b8" },
                                children: "#" + (x.idCmd || x.id)
                            })
                        ]
                    }),
                    s.jsx("select", {
                        value: st,
                        onChange: e => setCol(x, e.target.value),
                        className: "lvx-sel",
                        title: "بدّل حالة التوصيل",
                        style: { border: "1px solid " + cc + "55", background: cc + "0f", color: cc, borderRadius: 8, fontSize: 10, fontWeight: 800, padding: "4px 8px 4px 18px", outline: "none", maxWidth: 128 },
                        children: LSts.map(v => s.jsx("option", { value: v, children: v }, v))
                    })
                ]
            }),
            s.jsx("div", {
                style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6, marginTop: 8, padding: "6px 10px", background: "#f8fafc", borderRadius: 9 },
                children: [
                    s.jsx("span", { style: { fontSize: 9.5, fontWeight: 700, color: "#94a3b8" }, children: "المجموع" }),
                    s.jsx("b", {
                        style: { fontSize: 14.5, fontWeight: 800, color: "#0f172a", letterSpacing: "-.01em" },
                        children: [NF(tot), " DH"]
                    })
                ]
            }),
            s.jsx("div", {
                style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px", marginTop: 9 },
                children: [
                    Rw("📍", "المدينة", x.ville || "—"),
                    Rw("", "Frais livraison", NF(frx) + " DH", frx > 0 ? "#b45309" : "#334155"),
                    Rw("📞", "الهاتف", x.telephone || "—"),
                    Rw("🛍", "المنتج", (x.produit || "—") + " × " + (x.qte || 0)),
                    Rw("👤", "البائع", x.agent || "—"),
                    (Number(x.upsell) || 0) > 0 ? Rw("➕", "UPSEL", "+" + NF(x.upsell) + " DH", "#7c3aed") : null
                ]
            }),
            s.jsx("button", {
                onClick: onToggle,
                className: "lvx-dt",
                title: open ? "سدّ التفاصيل" : "شوف تفاصيل الشحن",
                style: { marginTop: 9, width: "100%", borderTop: "1px dashed #e2e8f0", padding: "7px 4px 1px", background: "transparent", borderLeft: "none", borderRight: "none", borderBottom: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 8 },
                children: [open ? "▴" : "▾", " تفاصيل الشحن"]
            }),
            open ? s.jsx("div", {
                className: "lvx-in",
                style: { marginTop: 8, background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 10, padding: 9, display: "flex", flexDirection: "column", gap: 7 },
                children: [
                    s.jsx("div", {
                        children: [
                            s.jsx("div", { style: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 3 }, children: "LIVREUR" }),
                            s.jsx("input", {
                                value: x.livreur || "",
                                onChange: e => uo(x.id, { livreur: e.target.value }),
                                placeholder: "اسم اللي كيوصّل...",
                                className: "lvx-input",
                                style: { width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, padding: "6px 9px", fontSize: 11, fontWeight: 600, color: "#0f172a", outline: "none" }
                            })
                        ]
                    }),
                    s.jsx("div", {
                        children: [
                            s.jsx("div", { style: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 3 }, children: "Tracking ID — شركة الشحن" }),
                            s.jsx("input", {
                                value: x.tracking || "",
                                onChange: e => uo(x.id, { tracking: e.target.value }),
                                placeholder: "TRK-...",
                                className: "lvx-input",
                                style: { width: "100%", boxSizing: "border-box", border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 8, padding: "6px 9px", fontSize: 11, fontWeight: 700, color: "#b45309", outline: "none" }
                            })
                        ]
                    }),
                    s.jsx("div", {
                        style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 },
                        children: [
                            s.jsx("div", {
                                children: [
                                    s.jsx("div", { style: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 3 }, children: "تاريخ الشحن" }),
                                    s.jsx("input", {
                                        type: "date",
                                        value: x.dateExp || "",
                                        onChange: e => uo(x.id, { dateExp: e.target.value }),
                                        className: "lvx-input",
                                        style: { width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, padding: "5px 7px", fontSize: 10, color: "#334155", outline: "none" }
                                    })
                                ]
                            }),
                            s.jsx("div", {
                                children: [
                                    s.jsx("div", { style: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 3 }, children: "تاريخ التوصيل" }),
                                    s.jsx("input", {
                                        type: "date",
                                        value: x.dateLiv || "",
                                        onChange: e => uo(x.id, { dateLiv: e.target.value }),
                                        className: "lvx-input",
                                        style: { width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, padding: "5px 7px", fontSize: 10, color: "#334155", outline: "none" }
                                    })
                                ]
                            })
                        ]
                    }),
                    (st === "Retour" || st === "Problème livraison" || x.motif) ? s.jsx("div", {
                        children: [
                            s.jsx("div", { style: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 3 }, children: "سبب الإرجاع" }),
                            s.jsx("input", {
                                value: x.motif || "",
                                onChange: e => uo(x.id, { motif: e.target.value }),
                                placeholder: "سبب الإرجاع...",
                                className: "lvx-input",
                                style: { width: "100%", boxSizing: "border-box", border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, padding: "6px 9px", fontSize: 11, fontWeight: 600, color: "#b91c1c", outline: "none" }
                            })
                        ]
                    }) : null,
                    s.jsx("div", {
                        style: { fontSize: 10.5, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 5, padding: "2px 2px 0" },
                        children: ["📍 العنوان: ", x.adresse || "—"]
                    })
                ]
            }) : null
        ]
    });
}

function Liv() {
    const { orders: o, upd: uo } = Xt();
    const { currentUser: us } = kr();
    const [sh, G] = ee.useState("");
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
    const kTotal = o.length;
    const kPrep = o.filter(x => ["À préparer", "Préparé"].includes(col(x))).length;
    const kRoad = o.filter(x => ["Expédié", "En livraison"].includes(col(x))).length;
    const kDone = o.filter(inC("Livré")).length;
    const kBad = o.filter(x => ["Refusé", "Retour", "Annulé", "Problème livraison"].includes(col(x))).length;
    const kCA = o.filter(inC("Livré")).reduce((a, x) => a + (Number(x.qte) || 0) * (Number(x.prix) || 0), 0);
    const kFrais = o.reduce((a, x) => a + frais(x), 0);
    const today = new Date().toLocaleDateString("ar-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const KPI = [
        { k: "total", ic: "📦", t: "كل الطلبيات", disp: NF(kTotal), sub: "من صفحة الطلبيات", c: "#3b82f6" },
        { k: "prep", ic: "🕐", t: "قيد التحضير", disp: NF(kPrep), sub: "À préparer + Préparé", c: "#f59e0b" },
        { k: "road", ic: "🛵", t: "فـ الطريق", disp: NF(kRoad), sub: "Expédié + En livraison", c: "#8b5cf6" },
        { k: "done", ic: "✅", t: "توصّلو", disp: NF(kDone), sub: "مكمّلين بنجاح", c: "#10b981" },
        { k: "bad", ic: "⚠️", t: "رجوع / إلغاء", disp: NF(kBad), sub: "خاصين المراجعة", c: "#ef4444" },
        { k: "ca", ic: "💰", t: "المبيعات الموصّلة", disp: NF(kCA) + " DH", sub: "رسوم التوصيل: " + NF(kFrais) + " DH", c: "#6366f1" }
    ];
    return s.jsx("div", {
        dir: "rtl",
        className: "h-full overflow-auto",
        style: { background: "#f1f5f9", padding: "18px 20px 28px" },
        children: s.jsx("div", {
            style: { maxWidth: 1540, margin: "0 auto" },
            children: [
                s.jsx("div", {
                    className: "lvx-in",
                    style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "14px 18px", marginBottom: 14, boxShadow: "0 1px 2px rgba(15,23,42,.04)", display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" },
                    children: [
                        s.jsx("span", {
                            style: { width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#f97316,#d97706)", color: "#fff", display: "grid", placeItems: "center", fontSize: 21, flexShrink: 0, boxShadow: "0 6px 16px rgba(217,119,6,.35)" },
                            children: "🚚"
                        }),
                        s.jsx("div", {
                            style: { minWidth: 0 },
                            children: [
                                s.jsx("div", { style: { fontSize: 9.5, fontWeight: 700, color: "#94a3b8", letterSpacing: ".03em", marginBottom: 2 }, children: "الرئيسية › ليفريزون" }),
                                s.jsx("h1", { style: { fontSize: 19, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em", margin: 0, lineHeight: 1.15 }, children: "LIVRAISON" }),
                                s.jsx("p", { style: { fontSize: 11, color: "#64748b", margin: 0 }, children: "إدارة توصيل الطلبيات — مربوطة أوتوماتيكياً مع صفحة الطلبيات" })
                            ]
                        }),
                        s.jsx("span", {
                            style: { borderRadius: 99, background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c", padding: "4px 12px", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" },
                            children: [NF(o.length), " طلبية"]
                        }),
                        s.jsx("span", {
                            title: "تاريخ اليوم",
                            style: { borderRadius: 99, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "4px 12px", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" },
                            children: ["📅 ", today]
                        }),
                        s.jsx("div", {
                            style: { marginInlineStart: "auto", position: "relative", minWidth: 220 },
                            children: [
                                s.jsx("span", {
                                    style: { position: "absolute", insetInlineStart: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, pointerEvents: "none" },
                                    children: "🔎"
                                }),
                                s.jsx("input", {
                                    value: sh,
                                    onChange: e => G(e.target.value),
                                    placeholder: "بحث (N° / Client / Téléphone / Ville / Produit)...",
                                    className: "lvx-input",
                                    style: { width: "100%", boxSizing: "border-box", minWidth: 300, border: "1px solid #e2e8f0", borderRadius: 11, background: "#f8fafc", padding: "9px 12px 9px 34px", fontSize: 11.5, fontWeight: 600, color: "#0f172a", outline: "none" }
                                })
                            ]
                        })
                    ]
                }),
                s.jsx("div", {
                    style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 },
                    children: KPI.map(k => s.jsx("div", {
                        key: k.k,
                        className: "lvx-kpi lvx-in",
                        "data-kpi": k.k,
                        style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px", boxShadow: "0 1px 2px rgba(15,23,42,.04)", position: "relative", overflow: "hidden" },
                        children: [
                            s.jsx("span", { style: { position: "absolute", insetInlineStart: 0, top: 12, bottom: 12, width: 3.5, borderRadius: 99, background: k.c } }),
                            s.jsx("div", {
                                style: { display: "flex", alignItems: "center", gap: 10 },
                                children: [
                                    s.jsx("span", {
                                        style: { width: 38, height: 38, borderRadius: 12, background: k.c + "16", display: "grid", placeItems: "center", fontSize: 17, flexShrink: 0 },
                                        children: k.ic
                                    }),
                                    s.jsx("div", {
                                        style: { minWidth: 0 },
                                        children: [
                                            s.jsx("div", { style: { fontSize: 10.5, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: k.t }),
                                            s.jsx("b", { style: { display: "block", fontSize: 19, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }, children: k.disp }),
                                            s.jsx("div", { style: { fontSize: 9.5, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: k.sub })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }))
                }),
                s.jsx("div", {
                    style: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "8px 14px", fontSize: 11, color: "#1e40af", marginBottom: 14, lineHeight: 1.7, fontWeight: 600 },
                    children: ["🔗 هاد الصفحة ", s.jsx("b", { children: "مربوطة مع Commandes" }), " — الداطا كتجي أوتوماتيك من الطلبيات، وكل تبديل هنا كيتسجل فالـ CRM ديال الجميع."]
                }),
                o.length ? s.jsx("div", {
                    className: "lvx-scroll",
                    style: { display: "flex", alignItems: "flex-start", gap: 12, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "thin" },
                    children: LCo.map(([st, ic]) => {
                        const cc = LvC[st] || "#64748b";
                        const list = shown.filter(x => col(x) === st);
                        const sum = list.reduce((a, x) => a + (Number(x.qte) || 0) * (Number(x.prix) || 0), 0);
                        return s.jsx("div", {
                            key: st,
                            className: "lvx-in",
                            style: { width: 264, flexShrink: 0, display: "flex", flexDirection: "column" },
                            children: [
                                s.jsx("div", {
                                    style: { display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #e2e8f0", borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "9px 12px" },
                                    children: [
                                        s.jsx("span", { style: { width: 8, height: 8, borderRadius: 99, background: cc, flexShrink: 0, boxShadow: "0 0 0 3px " + cc + "22" }, children: null }),
                                        s.jsx("span", { style: { fontSize: 13, lineHeight: 1 }, children: ic }),
                                        s.jsx("b", { style: { fontSize: 11.5, fontWeight: 800, color: "#0f172a" }, children: st }),
                                        s.jsx("span", {
                                            title: "عدد الطلبيات",
                                            style: { marginInlineStart: "auto", background: cc + "16", color: cc, borderRadius: 99, padding: "1px 8px", fontSize: 10.5, fontWeight: 800 },
                                            children: list.length
                                        }),
                                        s.jsx("span", {
                                            title: "مجموع المبيعات فالعمود",
                                            style: { fontSize: 9.5, fontWeight: 700, color: "#94a3b8", whiteSpace: "nowrap" },
                                            children: sum ? NF(sum) + " DH" : null
                                        })
                                    ]
                                }),
                                s.jsx("div", {
                                    style: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 8, minHeight: 150, display: "flex", flexDirection: "column", gap: 8 },
                                    children: list.length ? list.map(x => s.jsx(LivCard, {
                                        key: x.id,
                                        x: x,
                                        col: col,
                                        setCol: setCol,
                                        uo: uo,
                                        NF: NF,
                                        frais: frais,
                                        open: opn === x.id,
                                        onToggle: () => Opn(v => v === x.id ? null : x.id)
                                    })) : s.jsx("div", {
                                        style: { border: "1.5px dashed #cbd5e1", borderRadius: 10, padding: "16px 8px", textAlign: "center", color: "#94a3b8", fontSize: 10.5, fontWeight: 700, background: "#f8fafc" },
                                        children: sh ? "ما كاينش نتيجة للبحث" : "ما كاين حتى طلب"
                                    })
                                })
                            ]
                        });
                    })
                }) : s.jsx("div", {
                    style: { background: "#fff", border: "1.5px dashed #cbd5e1", borderRadius: 16, padding: "52px 20px", textAlign: "center" },
                    children: [
                        s.jsx("div", { style: { fontSize: 36, marginBottom: 10 }, children: "🚚" }),
                        s.jsx("div", { style: { fontSize: 13, fontWeight: 800, color: "#64748b" }, children: "ما كاين حتى طلبية فالـ CRM" }),
                        s.jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#cbd5e1", marginTop: 4 }, children: "الطلبيات كيجيو أوتوماتيك من صفحة Commandes — سجّل طلبية وكتلقاها هنا" })
                    ]
                })
            ]
        })
    });
}
