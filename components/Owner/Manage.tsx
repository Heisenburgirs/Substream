import { Card, Typography } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import loading from '../../public/loading.gif';
import Image from 'next/image';
import { CreateModal } from '../CreateModal'
import { ManageModal } from '../ManageModal'

interface ManageProps {
    rows: {
        name: string;
        id: string;
        subscription: boolean;
        action: string;
    }[];
    paymentOptions: Record<string, any[]>;
}

const TABLE_HEAD = ["Name", "ID", "Subscription", "Action"];
 
export const Manage: React.FC<ManageProps> = ({ rows, paymentOptions }) => {
	const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  
  const [currentServerId, setCurrentServerId] = useState('');

  const handleActionClick = (serverId: string, action: string) => {
    setCurrentServerId(serverId);
    if (action === "Create") {
      console.log("test1")
      setIsCreateModalOpen(true);
    } else if (action === "Manage") {
      console.log("test2")
      setIsManageModalOpen(true);
    }
  };

  useEffect(() => {
    if (rows && rows.length > 0) {
      setIsLoading(false);
    }
  }, [rows]);

  return (
    <div className="h-full w-full shadow-md rounded-15">
      {isLoading ?
					(
						<div>
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    {TABLE_HEAD.map((head) => (
                      <th
                        key={head}
                        className="border-b border-[#d9d9d9]  bg-blue-gray-50 p-4"
                      >
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="text-black font-bold leading-none"
                        >
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
              <div className="flex w-full justify-center py-8 items-center gap-4">
							  <Image src={loading} width={50} height={50} alt="Loading" />
                <span className="mt-4 font-bold">Please watch this parrot dance while we load...</span>
              </div>
						</div>
					)
					:
          (
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {TABLE_HEAD.map((head) => (
                    <th
                      key={head}
                      className="border-b border-[#d9d9d9] bg-blue-gray-50 p-4"
                    >
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="text-black font-bold leading-none"
                      >
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td className="p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {row.name}
                      </Typography>
                    </td>
                    <td className="p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {row.id}
                      </Typography>
                    </td>
                    <td className="p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {row.subscription ? "Enabled" : "None"}
                      </Typography>
                    </td>
                    <td className="p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal py-2 text-center max-w-[82px] bg-white border border-black border-opacity-50 rounded-10 hover:border-green-light hover:bg-green-light hover:text-white cursor-pointer transition-all"
                        onClick={() => handleActionClick(row.id, row.action)}
                      >
                        {row.action}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        )
      }
      <CreateModal
        discordServerId={currentServerId}
        onClose={() => setIsCreateModalOpen(false)}
        isOpen={isCreateModalOpen}
      />
      <ManageModal
        discordServerId={currentServerId}
        onClose={() => setIsManageModalOpen(false)}
        isOpen={isManageModalOpen}
        paymentOptions={paymentOptions}
      />
    </div>
  );
}