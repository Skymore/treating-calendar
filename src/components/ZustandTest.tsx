import { useEffect, useState } from 'react';
import { useTreatingStore } from '../stores/treatingStore';
import { v4 as uuidv4 } from 'uuid';

// Simple test component to verify if Zustand store shares state between multiple components
export default function ZustandTest() {
  const { persons, setPersons } = useTreatingStore();
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    console.log('ZustandTest component rendered with persons:', persons);
    setLastUpdate(new Date().toLocaleTimeString());
  }, [persons]);

  // Simple handler function to add a test person, verifying state updates
  const handleAddTestPerson = () => {
    setPersons(prevPersons => {
      const testPerson = {
        id: uuidv4(),
        userId: 'test-user',
        name: `Test Person ${prevPersons.length + 1}`,
        email: 'test@example.com',
        hostingCount: 0,
        lastHosted: '',
        hostOffset: 0,
        createdAt: new Date().toISOString(),
      };
      return [...prevPersons, testPerson];
    });
  };

  // Update the first person's hostingCount
  const handleUpdateFirstPerson = () => {
    if (persons.length === 0) {
      alert('Please add at least one person first');
      return;
    }

    setPersons(prevPersons => 
      prevPersons.map((person, index) => 
        index === 0 
          ? { ...person, hostingCount: person.hostingCount + 1 } 
          : person
      )
    );
  };

  // Clear the person list
  const handleClearPersons = () => {
    setPersons([]);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold text-blue-600 mb-4">Zustand State Sync Test</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          This is used to test if Zustand state synchronizes correctly between components. After adding or updating people, check if the Team Members table is also updated.
        </p>
        <p className="text-sm text-blue-600 font-medium mt-1">
          Person Count: {persons.length} | Last Update: {lastUpdate}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={handleAddTestPerson}
          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
        >
          Add Test Person
        </button>
        
        <button 
          onClick={handleUpdateFirstPerson}
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
          disabled={persons.length === 0}
        >
          Update First Person's Value
        </button>
        
        <button 
          onClick={handleClearPersons}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
          disabled={persons.length === 0}
        >
          Clear Person List
        </button>
      </div>
      
      {persons.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-2">Current Person List:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hosting Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {persons.map((person, index) => (
                  <tr key={person.id} className={index === 0 ? "bg-blue-50" : ""}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {person.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {person.email}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {person.hostingCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 