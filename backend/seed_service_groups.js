require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { sequelize, Sequelize } = require("./src/models");

function loadServiceGroupsExtra() {
    const p = path.join(__dirname, "seed-data", "home-inner", "service_groups_extra.json");
    if (!fs.existsSync(p)) {
        console.warn("[seed] optional missing:", p);
        return {};
    }
    try {
        const raw = JSON.parse(fs.readFileSync(p, "utf8"));
        console.log("[seed] merged service_groups_extra.json keys:", Object.keys(raw).join(", "));
        return raw;
    } catch (e) {
        console.warn("[seed] parse service_groups_extra failed:", e.message);
        return {};
    }
}

async function main() {
    try {
        // 1. Add group_type column if not exists
        await sequelize.query("ALTER TABLE Categories ADD COLUMN group_type VARCHAR(50) DEFAULT NULL").catch(() => {});
        console.log("Column group_type ensured");

        const serviceGroups = {
            tidy: {
                categories: [
                    { name: "热门服务", icon_url: "/img/index/menuicon1.png", sort_order: 1 },
                    { name: "厨房收纳", icon_url: "/img/index/menuicon2.png", sort_order: 2 },
                    { name: "搬家整理", icon_url: "/img/index/menuicon3.png", sort_order: 3 },
                    { name: "全屋收纳", icon_url: "/img/index/menuicon4.png", sort_order: 4 },
                    { name: "衣橱收纳", icon_url: "/img/index/menuicon1.png", sort_order: 5 }
                ],
                services: [
                    { cat: "衣橱收纳", title: "衣橱整理收纳【2小时】", price: 196, img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&q=80" },
                    { cat: "厨房收纳", title: "厨房整理收纳【2小时】", price: 196, img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80" },
                    { cat: "搬家整理", title: "日式打包复原整理【2小时】", price: 216, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80" },
                    { cat: "全屋收纳", title: "全屋整理收纳【3小时】", price: 292, img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80" },
                    { cat: "全屋收纳", title: "全屋整理收纳【4小时】", price: 385, img: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=300&q=80" }
                ]
            },
            urgent_fix: {
                categories: [
                    { name: "热门服务", icon_url: "/img/index/menuicon1.png", sort_order: 1 },
                    { name: "净水器维修", icon_url: "/img/index/menuicon2.png", sort_order: 2 },
                    { name: "灯具维修", icon_url: "/img/index/menuicon3.png", sort_order: 3 },
                    { name: "柜子维修", icon_url: "/img/index/menuicon4.png", sort_order: 4 },
                    { name: "管道疏通", icon_url: "/img/index/menuicon1.png", sort_order: 5 },
                    { name: "手机维修", icon_url: "/img/index/menuicon2.png", sort_order: 6 },
                    { name: "电路维修", icon_url: "/img/index/menuicon3.png", sort_order: 7 },
                    { name: "水路维修", icon_url: "/img/index/menuicon4.png", sort_order: 8 },
                    { name: "马桶维修", icon_url: "/img/index/menuicon1.png", sort_order: 9 },
                    { name: "厨房烟道串味", icon_url: "/img/index/menuicon2.png", sort_order: 10 },
                    { name: "零星打胶家修杂事", icon_url: "/img/index/menuicon3.png", sort_order: 11 }
                ],
                services: [
                    { cat: "净水器维修", title: "净水器故障维修【1小时】", price: 128, img: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=300&q=80" },
                    { cat: "灯具维修", title: "灯具线路与灯体维修【1小时】", price: 98, img: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=300&q=80" },
                    { cat: "柜子维修", title: "柜门铰链滑轨维修【1小时】", price: 118, img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80" },
                    { cat: "管道疏通", title: "厨房/卫浴管道疏通【1小时】", price: 158, img: "https://images.unsplash.com/photo-1581682040780-73c3a61d45a0?w=300&q=80" },
                    { cat: "手机维修", title: "上门手机维修【1小时】", price: 129, img: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&q=80" },
                    { cat: "电路维修", title: "家庭电路故障维修【1小时】", price: 169, img: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=300&q=80" },
                    { cat: "水路维修", title: "家庭水路维修【1小时】", price: 159, img: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=300&q=80" },
                    { cat: "马桶维修", title: "马桶维修与配件更换【1小时】", price: 139, img: "https://images.unsplash.com/photo-1581682040780-73c3a61d45a0?w=300&q=80" },
                    { cat: "厨房烟道串味", title: "厨房烟道串味治理【1小时】", price: 179, img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80" },
                    { cat: "零星打胶家修杂事", title: "零星打胶与家修杂事【1小时】", price: 99, img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80" }
                ]
            },
            beauty_home: {
                categories: [
                    { name: "热门服务", icon_url: "/img/index/menuicon1.png", sort_order: 1 },
                    { name: "上门纹绣", icon_url: "/img/index/menuicon2.png", sort_order: 2 },
                    { name: "上门美容", icon_url: "/img/index/menuicon3.png", sort_order: 3 },
                    { name: "化妆造型", icon_url: "/img/index/menuicon4.png", sort_order: 4 },
                    { name: "上门美甲", icon_url: "/img/index/menuicon1.png", sort_order: 5 },
                    { name: "上门美瞳", icon_url: "/img/index/menuicon2.png", sort_order: 6 },
                    { name: "上门美发", icon_url: "/img/index/menuicon3.png", sort_order: 7 }
                ],
                services: [
                    { cat: "上门纹绣", title: "上门纹绣咨询与设计【1小时】", price: 299, img: "https://images.unsplash.com/photo-1588611911484-8d590a0a6f92?w=300&q=80" },
                    { cat: "上门美容", title: "上门面部护理美容【1小时】", price: 169, img: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=300&q=80" },
                    { cat: "化妆造型", title: "活动化妆造型【1小时】", price: 199, img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80" },
                    { cat: "上门美甲", title: "上门美甲基础款【1小时】", price: 129, img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80" },
                    { cat: "上门美瞳", title: "上门美瞳搭配服务【1小时】", price: 159, img: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=300&q=80" },
                    { cat: "上门美发", title: "上门美发造型服务【1小时】", price: 189, img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80" }
                ]
            },
            ...loadServiceGroupsExtra()
        };

        const t = await sequelize.transaction();
        try {
            for (const [groupKey, groupData] of Object.entries(serviceGroups)) {
                const catMap = {};

                for (const cat of groupData.categories) {
                    const rows = await sequelize.query(
                        "SELECT id FROM Categories WHERE name=? AND group_type=? LIMIT 1",
                        { replacements: [cat.name, groupKey], type: Sequelize.QueryTypes.SELECT, transaction: t }
                    );
                    if (rows.length > 0) {
                        catMap[cat.name] = rows[0].id;
                        console.log("Category exists: " + cat.name + " (" + groupKey + ") id=" + rows[0].id);
                    } else {
                        await sequelize.query(
                            "INSERT INTO Categories (name, icon_url, sort_order, group_type, createdAt, updatedAt) VALUES (?,?,?,?,NOW(),NOW())",
                            { replacements: [cat.name, cat.icon_url, cat.sort_order, groupKey], transaction: t }
                        );
                        const newRows = await sequelize.query(
                            "SELECT id FROM Categories WHERE name=? AND group_type=? LIMIT 1",
                            { replacements: [cat.name, groupKey], type: Sequelize.QueryTypes.SELECT, transaction: t }
                        );
                        catMap[cat.name] = newRows[0].id;
                        console.log("Inserted category: " + cat.name + " (" + groupKey + ") id=" + newRows[0].id);
                    }
                }

                for (const svc of groupData.services) {
                    const catId = catMap[svc.cat];
                    const existing = await sequelize.query(
                        "SELECT id FROM Services WHERE title=? AND category_id=? LIMIT 1",
                        { replacements: [svc.title, catId], type: Sequelize.QueryTypes.SELECT, transaction: t }
                    );
                    const sc = svc.sales_count_hint != null ? Number(svc.sales_count_hint) : null;
                    if (existing.length > 0) {
                        if (sc != null && !Number.isNaN(sc)) {
                            await sequelize.query(
                                "UPDATE Services SET price=?, cover_image=?, sales_count=?, updatedAt=NOW() WHERE id=?",
                                { replacements: [svc.price, svc.img, sc, existing[0].id], transaction: t }
                            );
                        } else {
                            await sequelize.query(
                                "UPDATE Services SET price=?, cover_image=?, updatedAt=NOW() WHERE id=?",
                                { replacements: [svc.price, svc.img, existing[0].id], transaction: t }
                            );
                        }
                        console.log("Updated service: " + svc.title);
                    } else {
                        const initialSales = sc != null && !Number.isNaN(sc) ? sc : 0;
                        await sequelize.query(
                            "INSERT INTO Services (category_id, title, description, price, cover_image, sales_count, createdAt, updatedAt) VALUES (?,?,?,?,?,?,NOW(),NOW())",
                            { replacements: [catId, svc.title, svc.title, svc.price, svc.img, initialSales], transaction: t }
                        );
                        console.log("Inserted service: " + svc.title);
                    }
                }
            }

            await t.commit();
            console.log("All service groups seeded successfully!");
        } catch (e) {
            await t.rollback();
            throw e;
        }
        process.exit(0);
    } catch (e) {
        console.error("Failed:", e.message);
        process.exit(1);
    }
}

main();
