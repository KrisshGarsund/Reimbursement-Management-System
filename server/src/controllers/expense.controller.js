import * as expenseService from '../services/expense.service.js';
import * as currencyService from '../services/currency.service.js';
import { Parser } from 'json2csv';

export async function createExpense(req, res, next) {
  try {
    const { amount, currency, category, description, date } = req.body;
    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await expenseService.createExpense({
      companyId: req.user.companyId,
      submittedById: req.user.id,
      amount: parseFloat(amount),
      currency,
      category,
      description,
      date,
      receiptUrl,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function listExpenses(req, res, next) {
  try {
    const { status, category, startDate, endDate, employeeId, page, limit } = req.query;
    const result = await expenseService.listExpenses({
      companyId: req.user.companyId,
      userId: req.user.id,
      role: req.user.role,
      status,
      category,
      startDate,
      endDate,
      employeeId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getExpense(req, res, next) {
  try {
    const expense = await expenseService.getExpense(req.params.id, req.user.companyId);
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseHistory(req, res, next) {
  try {
    const history = await expenseService.getExpenseHistory(req.params.id, req.user.companyId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

export async function convertCurrency(req, res, next) {
  try {
    const { amount, from, to } = req.query;
    const converted = await currencyService.convert(parseFloat(amount), from, to);
    res.json({ success: true, data: { converted, from, to, rate: converted / parseFloat(amount) } });
  } catch (error) {
    next(error);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const expenses = await expenseService.exportExpensesCSV(req.user.companyId);
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Employee', value: 'submittedBy.name' },
      { label: 'Email', value: 'submittedBy.email' },
      { label: 'Amount', value: 'amount' },
      { label: 'Currency', value: 'currency' },
      { label: 'Converted Amount', value: 'convertedAmount' },
      { label: 'Company Currency', value: 'companyCurrency' },
      { label: 'Category', value: 'category' },
      { label: 'Description', value: 'description' },
      { label: 'Date', value: 'date' },
      { label: 'Status', value: 'status' },
      { label: 'AI Flagged', value: 'aiFlag' },
      { label: 'AI Severity', value: 'aiSeverity' },
      { label: 'Created At', value: 'createdAt' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(expenses);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
