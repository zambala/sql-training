import { Database } from "../src/database";
import { minutes } from "./utils";

describe("Queries Across Tables", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("03", "04");
    }, minutes(1));

    it("should select count of apps which have free pricing plan", async done => {
        const query = `
                        SELECT COUNT(*) AS count
                        FROM apps_pricing_plans
                        JOIN pricing_plans
                            ON apps_pricing_plans.pricing_plan_id = pricing_plans.id
                        WHERE pricing_plans.price LIKE 'Free%'
                    `;
        const result = await db.selectSingleRow(query);
        expect(result).toEqual({
            count: 1112
        });
        done();
    }, minutes(10));

    it("should select top 3 most common categories", async done => {
        const query = `
                        SELECT COUNT(*) AS count,
                                categories.title as category
                        FROM apps_categories
                        JOIN categories
                            ON apps_categories.category_id = categories.id
                        GROUP BY category
                        ORDER BY count DESC
                        LIMIT 3
                    `;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 1193, category: "Store design" },
            { count: 723, category: "Sales and conversion optimization" },
            { count: 629, category: "Marketing" }
        ]);
        done();
    }, minutes(10));

    it("should select top 3 prices by appearance in apps and in price range from $5 to $10 inclusive (not matters monthly or one time payment)", async done => {
        const query = `
                        SELECT 	COUNT(*) as count,
                        price,
                        CAST(REPLACE(REPLACE(REPLACE(price, ' one time charge', ''), '/month', ''), '$', '')AS double) as casted_price
                        FROM pricing_plans
                        JOIN apps_pricing_plans
                            ON pricing_plans.id = apps_pricing_plans.pricing_plan_id
                        WHERE casted_price BETWEEN 5 AND 10
                        GROUP BY casted_price
                        ORDER BY count DESC
                        LIMIT 3
                        `;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 225, price: "$9.99/month", casted_price: 9.99 },
            { count: 135, price: "$5/month", casted_price: 5 },
            { count: 114, price: "$10/month", casted_price: 10 }
        ]);
        done();
    }, minutes(10));
});