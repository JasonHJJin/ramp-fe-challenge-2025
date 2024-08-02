import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee, Transaction } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const updateAllTransactions = useCallback((newTransactions: Transaction[]) => {
    setAllTransactions((prevTransactions) => {
      const newUniqueTransactions = newTransactions.filter(
        (newTransaction) => !prevTransactions.some((prevTransaction) => prevTransaction.id === newTransaction.id)
      );
      return [...prevTransactions, ...newUniqueTransactions];
    });
  }, []);

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData();
    await employeeUtils.fetchAll();
    await paginatedTransactionsUtils.fetchAll();
    setIsLoading(false);
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  const handleLoadMore = useCallback(async () => {
    setIsLoading(true);
    if (selectedEmployee && selectedEmployee !== EMPTY_EMPLOYEE) {
      await loadTransactionsByEmployee(selectedEmployee.id);
    } else {
      await paginatedTransactionsUtils.fetchAll();
    }
    setIsLoading(false);
  }, [selectedEmployee, loadTransactionsByEmployee, paginatedTransactionsUtils]);

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  useEffect(() => {
    if (transactions) {
      updateAllTransactions(transactions);
    }
  }, [transactions, updateAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            setSelectedEmployee(newValue);
            setAllTransactions([]);
            if (newValue === null || newValue === EMPTY_EMPLOYEE) {
              await loadAllTransactions();
              return;
            }
            await loadTransactionsByEmployee(newValue.id);
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={allTransactions} />

          {transactions !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading || isLoading}
              onClick={handleLoadMore}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
