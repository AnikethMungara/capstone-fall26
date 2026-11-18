// Survey content, organised for pre/post testing.
//
// Each module has CONCEPTS. Each concept has three parallel FORMS (A, B, C)
// that test the same idea with different wording/numbers, so the pre and post
// surveys measure learning rather than memory of the answers.
//   Form A = pre-survey (A questions marked `doc` come from the teaching doc)
//   Form B = post-survey
//   Form C = follow-up / retake
// All of forms B and C, and the non-doc A items, are drafts to review.
//
// type "single": answer = option index.  "multi": answer = array of indexes.
// type "scale":  self-rating 1-5, ungraded (tracks confidence before/after).

export const phases = {
  pre: { label: "Pre-survey", form: "A", blurb: "Before the module" },
  post: { label: "Post-survey", form: "B", blurb: "After the module" },
  followup: { label: "Follow-up", form: "C", blurb: "Weeks later" },
  feedback: { label: "Feedback", form: null, kind: "feedback", blurb: "Qualitative: tags + text" },
};

const s = (text, options, answer, explanation) => ({ text, options, answer, explanation });
const m = s;
const sc = (text, lo, hi) => ({ text, scaleLabels: [lo, hi] });

export const modules = [
  {
    id: "m1", title: "Currency & Budgeting", icon: "💵",
    blurb: "Forms of exchange, income, expenses and budgets.",
    concepts: [
      { id: "power", type: "single", forms: {
        A: s("Which phrase best reflects the idea that the purchasing power of money can change over time?",
          ["Money now can be worth more than the same amount in the future.", "It’s important to spend immediately rather than save.", "Financial goals should always be short-term.", "Saving is only effective when interest is very high."], 0,
          "Inflation erodes purchasing power, so money today is usually worth more than the same amount later."),
        B: s("With 3% yearly inflation, which statement about $100 today versus $100 in ten years is true?",
          ["$100 today can buy more than $100 in ten years.", "They buy exactly the same amount.", "$100 in ten years buys more because it is newer.", "Prices only rise for luxury goods."], 0,
          "Rising prices mean each dollar buys less over time."),
        C: s("Why might a $4 coffee cost $5 a few years from now?",
          ["Prices tend to rise, so each dollar buys less.", "Coffee shops dislike customers.", "Money gets heavier over time.", "Savings accounts cause price increases."], 0,
          "General price increases (inflation) lower purchasing power."),
      } },
      { id: "balance", type: "single", forms: {
        A: s("Jessica earns $3,000 a month. Necessary expenses are $1,200 and extra spending is $1,900. What was her situation?",
          ["She saved a surplus.", "She experienced a deficit.", "She spent exactly her income.", "Her expenses matched her income."], 1,
          "$1,200 + $1,900 = $3,100, which is $100 more than she earned."),
        B: s("Marcus earns $2,400 a month. Needs cost $1,500 and wants cost $700. What was his situation?",
          ["A surplus of $200", "A deficit of $200", "He broke even", "It can’t be determined"], 0,
          "$1,500 + $700 = $2,200, leaving $200."),
        C: s("Priya earns $4,000 a month. Rent and bills are $2,100 and other spending is $2,000. What happened?",
          ["She saved a surplus.", "Her spending matched her income.", "She had a deficit of $100.", "She had a deficit of $900."], 2,
          "$2,100 + $2,000 = $4,100, which is $100 over her income."),
      } },
      { id: "masked", type: "multi", forms: {
        A: m("Which of these are “masked” expenses? Select all that apply.",
          ["Streaming subscription", "Monthly rent", "Bank account fees", "Weekly groceries"], [0, 2],
          "Subscriptions and fees quietly recur; rent and groceries are obvious, necessary costs."),
        B: m("Which of these costs can quietly recur without you noticing? Select all that apply.",
          ["Gym membership that auto-renews", "Monthly electric bill", "Overdraft fee", "Weekly grocery trip"], [0, 2],
          "Auto-renewals and fees are easy to overlook."),
        C: m("Which of the following would a careful budgeter treat as a hidden or masked cost? Select all that apply.",
          ["Interest charged on a credit card", "Rent", "Cloud storage subscription", "Gas for your commute"], [0, 2],
          "Interest and small subscriptions hide in the background of your spending."),
      } },
      { id: "emergency", type: "single", forms: {
        A: s("Your car needs a surprise $400 repair. What would have helped most?",
          ["A credit card with a high limit", "An emergency fund", "A bigger paycheck next year", "Skipping the repair"], 1,
          "An emergency fund absorbs surprises without debt."),
        B: s("Aaron and Sam suddenly need cash. Which of their holdings is hardest to use on short notice?",
          ["Cash in a checking account", "Money invested in a business", "Funds in a money market account", "Savings in a high-interest savings account"], 1,
          "Business investments are illiquid; the others can be withdrawn quickly."),
        C: s("Which is the best use of an emergency fund?",
          ["A concert ticket sale", "An unexpected medical bill", "Holiday gifts", "A phone upgrade"], 1,
          "Emergency funds are for unplanned, necessary expenses."),
      } },
      { id: "confidence", type: "scale", forms: {
        A: sc("How confident are you about sticking to a monthly budget?", "Not at all", "Very confident"),
        B: sc("How prepared would you be for an unexpected $500 expense?", "Not prepared", "Very prepared"),
        C: sc("How often do you track what you spend?", "Never", "Always"),
      } },
    ],
  },
  {
    id: "m2", title: "Saving & Compound Interest", icon: "📈",
    blurb: "Why starting early matters and how banks make money.",
    concepts: [
      { id: "early", type: "single", forms: {
        A: s("Chloe invests $3,000/yr from age 30. James waits until 50 and invests $6,000/yr. Who likely has more at 75?",
          ["James, because he contributed more each year.", "Chloe, because she started earlier and compound interest had longer to work.", "They’d have the same amount.", "Chloe, because she saved double the amount James did."], 1,
          "Time in the market beats contribution size when compounding is involved."),
        B: s("Ana saves $2,000/yr from age 22 to 32, then stops. Ben saves $2,000/yr from 32 to 62. With similar returns, who likely has more at 65?",
          ["Ana, even though she contributed less in total.", "Ben, because he contributed three times as much.", "They have exactly the same.", "It depends only on the stock market’s mood."], 0,
          "Ana’s early money had decades more to compound."),
        C: s("Two friends save the same monthly amount at the same return. One starts at 25, the other at 35. Who has more at 65?",
          ["The one who started at 25", "The one who started at 35", "They have the same", "Neither earns anything"], 0,
          "Ten extra years of compounding adds a lot."),
      } },
      { id: "banks", type: "single", forms: {
        A: s("How do banks generally make money when they lend to consumers?",
          ["They borrow at lower rates and lend at higher rates.", "They charge fees only for services.", "They collect credit card fees alone.", "They charge the same rate for borrowing and lending."], 0,
          "The gap between the rate they pay and the rate they charge is their spread."),
        B: s("A bank pays savers 2% and charges borrowers 7%. What does the 5% gap represent?",
          ["A government tax", "The bank’s profit margin (spread)", "A penalty for savers", "An inflation adjustment"], 1,
          "That spread is how banks earn revenue on lending."),
        C: s("Why can banks afford to pay interest on savings accounts?",
          ["They lend deposits out at higher rates.", "They print money for each account.", "The government pays all interest.", "Interest is a gift to customers."], 0,
          "Lending income funds the interest paid to depositors."),
      } },
      { id: "compound", type: "single", forms: {
        A: s("You deposit $1,000 at 5%. After year 2, which interest type gives you more?",
          ["Simple interest", "Compound interest", "They’re identical", "Depends on the bank’s logo"], 1,
          "Compound earns interest on past interest: $1,102.50 vs $1,100."),
        B: s("Interest earned on both the original amount and on previously earned interest is called…",
          ["Simple interest", "Compound interest", "Principal", "A service fee"], 1,
          "That’s the definition of compound interest."),
        C: s("A $500 balance grows 10% and becomes $550. How is year-2 interest calculated with compounding?",
          ["On the full $550", "On the original $500 again", "No interest is earned", "Only on the $50 gained"], 0,
          "Compounding applies the rate to the new, larger balance."),
      } },
      { id: "rates", type: "single", forms: {
        A: s("A savings account pays 4% and a loan costs 9%. What does that gap suggest?",
          ["Pay down the loan before saving extra", "Borrow more and save the difference", "Rates don’t matter over time", "Ignore the loan, it’s small"], 0,
          "Debt costing more than savings earn is a guaranteed loss."),
        B: s("A credit card charges 22% APR and savings pay 3%. You have $1,000 spare (and a basic emergency fund). Best move?",
          ["Pay down the card", "Put it in savings", "Spend it", "Split it with no plan"], 0,
          "Eliminating 22% interest beats earning 3%."),
        C: s("Why do small differences in interest rates matter?",
          ["They compound into big differences over time.", "They don’t until they exceed 10%.", "They only affect banks.", "They only affect short loans."], 0,
          "Even 1% extra, compounded over decades, adds up."),
      } },
      { id: "confidence", type: "scale", forms: {
        A: sc("How comfortable are you explaining compound interest to a friend?", "Not at all", "Very comfortable"),
        B: sc("How likely are you to start saving something each month?", "Unlikely", "Very likely"),
        C: sc("How well do you understand the interest rates on your own accounts?", "Not at all", "Very well"),
      } },
    ],
  },
  {
    id: "m3", title: "Credit & Monthly Payments", icon: "💳",
    blurb: "Credit cards, minimum payments and credit scores.",
    concepts: [
      { id: "minimum", type: "single", forms: {
        A: s("You owe $2,500 at 14% APR and pay only the $25 minimum. With no new charges, how long might payoff take?",
          ["Less than 5 years", "Around 7 years", "Between 10 and 15 years", "An extremely long time, keeping you in debt for years"], 3,
          "The minimum barely exceeds monthly interest, so the balance shrinks very slowly."),
        B: s("Why are minimum payments a costly strategy?",
          ["Most of the payment goes to interest, so the balance falls slowly.", "They are illegal.", "They raise your credit limit.", "Interest stops while you pay them."], 0,
          "Interest consumes most of a minimum payment."),
        C: s("You owe $1,000 at 18% APR. Which approach costs the least?",
          ["Paying a fixed amount well above the minimum", "Paying only the minimum", "Skipping a month", "Paying the minimum and charging more"], 0,
          "Larger payments cut principal faster and reduce total interest."),
      } },
      { id: "habit", type: "single", forms: {
        A: s("Which action is least likely to improve your credit score?",
          ["Paying bills on time each month", "Keeping balances below 30% of your limit", "Opening many new cards and then not using them", "Maintaining a history of positive payments"], 2,
          "Many new accounts trigger hard inquiries and lower your average account age."),
        B: s("Which action will most likely hurt your credit score?",
          ["Paying on time", "Missing payments", "Keeping utilization low", "Keeping old accounts open"], 1,
          "Payment history is the biggest factor, and missed payments hurt it."),
        C: s("Which habit best builds credit over time?",
          ["Paying on time every month", "Maxing out cards, then paying them off", "Closing your oldest card", "Applying for many cards at once"], 0,
          "Consistent on-time payments build a positive history."),
      } },
      { id: "factors", type: "multi", forms: {
        A: m("Which factors commonly feed a credit score? Select all that apply.",
          ["Payment history", "Credit utilization", "Your salary", "Length of credit history"], [0, 1, 3],
          "Income isn’t part of a credit score."),
        B: m("Which of these does a lender typically look at when calculating your credit score? Select all that apply.",
          ["On-time payments", "Your job title", "Balance compared to limit", "Types of credit accounts"], [0, 2, 3],
          "Job title isn’t part of a credit score."),
        C: m("Which of the following is part of how a credit score is built? Select all that apply.",
          ["Number of recent applications", "Your zip code", "Payment history", "Age of your oldest account"], [0, 2, 3],
          "Location isn’t part of a credit score."),
      } },
      { id: "questions", type: "single", forms: {
        A: s("Before opening a new card, which question matters most to ask?",
          ["What’s the APR and are there annual fees?", "What color is the card?", "How many ads will I get?", "Can I get it today?"], 0,
          "APR and fees determine the real cost of carrying a balance."),
        B: s("A card offers 0% for six months. What should you ask?",
          ["What APR applies after the promo, and what are the fees?", "Is the card shiny?", "Nothing, 0% is always free.", "Can I tell my friends?"], 0,
          "Promo rates end; the later APR and fees are what matter."),
        C: s("Which term tells you the yearly cost of carrying a card balance?",
          ["APR", "Statement date", "Card number", "Reward tier"], 0,
          "APR is the annualized cost of borrowing."),
      } },
      { id: "confidence", type: "scale", forms: {
        A: sc("How often do you check what a purchase will cost you in interest?", "Never", "Always"),
        B: sc("How well do you know your current credit score range?", "Not at all", "Very well"),
        C: sc("How comfortable are you asking a lender about fees?", "Not at all", "Very comfortable"),
      } },
    ],
  },
  {
    id: "m4", title: "Assets, Liabilities & Wealth", icon: "🏦",
    blurb: "Net worth, debt payoff strategies and giving back.",
    concepts: [
      { id: "liabilities", type: "multi", forms: {
        A: m("Which of the following are liabilities? Select all that apply.",
          ["Car loan", "Money saved in a retirement account", "Credit card balance", "Mortgage loan"], [0, 2, 3],
          "Liabilities are what you owe; savings are assets."),
        B: m("Which of these represent money you owe to someone else? Select all that apply.",
          ["Student loan", "The value of a home you own", "Savings account", "Personal loan from a friend"], [0, 3],
          "Money you owe is a liability; things you own are assets."),
        C: m("Which of the following would appear on the liabilities side of a balance sheet? Select all that apply.",
          ["Overdue utility bill", "Stocks you own", "Mortgage", "Cash in your wallet"], [0, 2],
          "Bills and loans you owe are liabilities."),
      } },
      { id: "real", type: "single", forms: {
        A: s("A savings account pays 1.5%/yr while inflation is 3%. After a year, your money buys…",
          ["More than today", "The same as today", "Less than today"], 2,
          "Real return is about -1.5%, so purchasing power drops."),
        B: s("An account pays 2% while inflation is 4%. After a year, your money buys…",
          ["More than today", "The same as today", "Less than today"], 2,
          "Inflation outpaces interest, so purchasing power falls."),
        C: s("An account pays 5% while inflation is 2%. After a year, your money buys…",
          ["More than today", "The same as today", "Less than today"], 0,
          "Interest beats inflation, so purchasing power rises."),
      } },
      { id: "networth", type: "single", forms: {
        A: s("How is net worth determined?",
          ["Total assets minus total liabilities", "Annual income divided by age", "Income minus monthly expenses", "Annual income times credit score"], 0,
          "Net worth = assets − liabilities."),
        B: s("Someone has $50,000 in assets and $20,000 in liabilities. What is their net worth?",
          ["$30,000", "$70,000", "$20,000", "$50,000"], 0,
          "$50,000 − $20,000 = $30,000."),
        C: s("Which change raises your net worth?",
          ["Your investments gain value", "You take a loan and spend it", "You buy a gift on credit", "You incur a late fee"], 0,
          "A larger asset value with the same debts means higher net worth."),
      } },
      { id: "payoff", type: "single", forms: {
        A: s("In the “snowball” method of debt payoff, which debt do you target first?",
          ["Highest interest rate", "Smallest balance", "Oldest debt", "Largest balance"], 1,
          "Snowball clears the smallest balance first for momentum; avalanche targets the highest rate."),
        B: s("In the “avalanche” method, which debt do you pay first?",
          ["Highest interest rate", "Smallest balance", "Newest debt", "Lowest interest rate"], 0,
          "Avalanche minimizes total interest by hitting the highest rate first."),
        C: s("What is the most important step in paying off debt?",
          ["Getting started and staying consistent", "Waiting for the perfect plan", "Hiding the statements", "Opening new cards"], 0,
          "Any reasonable plan you actually follow beats a perfect plan you never start."),
      } },
      { id: "confidence", type: "scale", forms: {
        A: sc("How motivated do you feel to start paying down debt or building savings today?", "Not yet", "Ready now"),
        B: sc("How confident are you that you could calculate your net worth today?", "Not at all", "Very confident"),
        C: sc("How likely are you to set a savings goal this month?", "Unlikely", "Very likely"),
      } },
    ],
  },
];

// Flatten a module's concepts into the question list for one form (A/B/C).
export function getQuestions(module, form) {
  return module.concepts.map((c) => ({
    id: `${module.id}.${c.id}.${form}`,
    conceptId: c.id,
    type: c.type,
    ...c.forms[form],
  }));
}
